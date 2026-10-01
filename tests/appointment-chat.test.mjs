import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost } from "../functions/api/appointment-chat.js";

const env = { HULI_API_KEY: "test", HULI_ORGANIZATION_ID: "562", HULI_DOCTOR_ID: "542", OPENAI_API_KEY: "test" };
const future = new Date(Date.now() + 2 * 86_400_000);
future.setUTCHours(17, 0, 0, 0);
const timestamp = future.toISOString().slice(0, 10).replaceAll("-", "") + "T1700";
const slot = { dateTime: future.toISOString(), time: timestamp, sourceEvent: "12345" };
const available = { slotDates: [{ date: future.toISOString(), slots: [slot] }] };
const patient = { id: "77", personalData: { firstName: "Ana", lastName: "Prueba", patientIds: [{ idNumber: "123456789" }] }, contact: { email: "ana@example.com" } };

function reply(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

async function post(body) {
  const request = new Request("https://example.com/api/appointment-chat", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "https://example.com" }, body: JSON.stringify(body)
  });
  const response = await onRequestPost({ request, env });
  return { status: response.status, data: await response.json() };
}

test("availability reads both Huli clinics and returns selectable slots", async () => {
  const oldFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith("/authorization/token")) return reply({ data: { jwt: "jwt" } });
    return reply(available);
  };
  try {
    const result = await post({ action: "availability", offsetDays: 0 });
    assert.equal(result.status, 200);
    assert.equal(result.data.slots.length, 2);
    assert.deepEqual(result.data.slots.map((item) => item.clinicId), ["88", "393"]);
    assert.match(result.data.slots[0].label, /5:00 p\. m\./);
    assert.ok(calls.some((url) => url.includes("/clinic/88")));
    assert.ok(calls.some((url) => url.includes("/clinic/393")));
  } finally { globalThis.fetch = oldFetch; }
});

test("availability for a specific date queries one day and filters other dates", async () => {
  const oldFetch = globalThis.fetch;
  const calls = [];
  const requestedDate = future.toISOString().slice(0, 10);
  const other = new Date(future.getTime() + 86_400_000);
  const otherSlot = { dateTime: other.toISOString(), time: other.toISOString().slice(0, 10).replaceAll("-", "") + "T1700", sourceEvent: "12346" };
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith("/authorization/token")) return reply({ data: { jwt: "jwt" } });
    return reply({ slotDates: [{ slots: [slot, otherSlot] }] });
  };
  try {
    const result = await post({ action: "availability", date: requestedDate });
    assert.equal(result.status, 200);
    assert.equal(result.data.slots.length, 2);
    assert.ok(result.data.slots.every((item) => item.date === requestedDate));
    assert.equal(result.data.nextOffsetDays, null);
    const query = new URL(calls.find((url) => url.includes("/availability/")));
    assert.equal(query.searchParams.get("from"), `${requestedDate}T00:00:00.000Z`);
    assert.equal(query.searchParams.get("to"), new Date(Date.parse(`${requestedDate}T00:00:00Z`) + 86_400_000).toISOString());
  } finally { globalThis.fetch = oldFetch; }
});

test("specific-date availability rejects invalid or distant days before Huli requests", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("unexpected network request"); };
  try {
    for (const date of ["2026-02-31", "not-a-date", new Date(Date.now() + 40 * 86_400_000).toISOString().slice(0, 10)]) {
      const result = await post({ action: "availability", date });
      assert.equal(result.status, 400);
      assert.match(result.data.reply, /cuatro semanas/);
    }
  } finally { globalThis.fetch = oldFetch; }
});

test("short approved information answer does not spend OpenAI tokens", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("unexpected network request"); };
  try {
    const result = await post({ action: "info", message: "¿Qué es IncontiLase?" });
    assert.equal(result.status, 200);
    assert.match(result.data.reply, /INCONTILASE/i);
  } finally { globalThis.fetch = oldFetch; }
});

test("appointment lookup requires contact from the patient record", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith("/authorization/token")) return reply({ data: { jwt: "jwt" } });
    if (String(url).includes("/patient-file?")) return reply({ patientFiles: [patient] });
    if (String(url).endsWith("/patient-file/77")) return reply(patient);
    throw new Error("appointment details must remain private");
  };
  try {
    const result = await post({ action: "lookup", cedula: "123456789", contact: "other@example.com" });
    assert.equal(result.status, 403);
  } finally { globalThis.fetch = oldFetch; }
});

test("verified contact receives appointment details without OpenAI", async () => {
  const oldFetch = globalThis.fetch;
  let appointmentRead = false;
  globalThis.fetch = async (url) => {
    const path = String(url);
    if (path.endsWith("/authorization/token")) return reply({ data: { jwt: "jwt" } });
    if (path.includes("/patient-file?")) return reply({ patientFiles: [patient] });
    if (path.includes("/appointment/patient/77")) {
      appointmentRead = true;
      return reply({ appointments: [{ idEvent: "567", idDoctor: "542", idPatientFile: "77", statusAppointment: "BOOKED", startDate: "2026-10-15", timeFrom: "09:00:00" }] });
    }
    throw new Error(`unexpected request ${path}`);
  };
  try {
    const result = await post({ action: "lookup", cedula: "123456789", contact: "ana@example.com" });
    assert.equal(result.status, 200);
    assert.equal(appointmentRead, true);
    assert.match(result.data.reply, /15 oct/);
  } finally { globalThis.fetch = oldFetch; }
});

test("long approved answer caps OpenAI output and excludes storage", async () => {
  const oldFetch = globalThis.fetch;
  let call;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "https://api.openai.com/v1/responses");
    call = JSON.parse(options.body);
    return reply({ output_text: "Información general aprobada." });
  };
  try {
    const result = await post({ action: "info", message: "Quiero entender mejor en qué consiste IncontiLase y qué explica la página sobre este procedimiento antes de pedir una cita" });
    assert.equal(result.status, 200);
    assert.equal(call.max_output_tokens, 140);
    assert.equal(call.store, false);
  } finally { globalThis.fetch = oldFetch; }
});

test("booking rechecks slot and creates appointment for verified patient", async () => {
  const oldFetch = globalThis.fetch;
  let booked;
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url);
    if (path.endsWith("/authorization/token")) return reply({ data: { jwt: "jwt" } });
    if (path.includes("/availability/")) return reply(available);
    if (path.includes("/patient-file?")) return reply({ patientFiles: [patient] });
    if (path.endsWith("/appointment") && options.method === "POST") {
      booked = JSON.parse(options.body);
      return reply({ idEvent: "999" });
    }
    throw new Error(`unexpected request ${path}`);
  };
  try {
    const result = await post({ action: "book", slot: { clinicId: "88", date: future.toISOString().slice(0, 10), time: "17:00", sourceEvent: "12345" }, patient: { name: "Ana Prueba", cedula: "123456789", phone: "88889999", email: "ana@example.com" } });
    assert.equal(result.status, 200);
    assert.equal(result.data.booked, true);
    assert.equal(booked.id_patient_file, 77);
    assert.equal(booked.source_event, 12345);
  } finally { globalThis.fetch = oldFetch; }
});

test("stale slot is rejected before any patient or booking write", async () => {
  const oldFetch = globalThis.fetch;
  let writes = 0;
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === "POST" && !String(url).endsWith("/authorization/token")) writes += 1;
    if (String(url).endsWith("/authorization/token")) return reply({ data: { jwt: "jwt" } });
    return reply({ slotDates: [] });
  };
  try {
    const result = await post({ action: "book", slot: { clinicId: "88", date: future.toISOString().slice(0, 10), time: "17:00", sourceEvent: "12345" }, patient: { name: "Ana Prueba", cedula: "123456789", phone: "88889999", email: "ana@example.com" } });
    assert.equal(result.status, 409);
    assert.equal(writes, 0);
  } finally { globalThis.fetch = oldFetch; }
});

test("new patient is created before Huli appointment", async () => {
  const oldFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url);
    if (path.endsWith("/authorization/token")) return reply({ data: { jwt: "jwt" } });
    if (path.includes("/availability/")) return reply(available);
    if (path.includes("/patient-file?")) return reply({ patientFiles: [] });
    if (options.method === "POST") {
      writes.push({ path, body: JSON.parse(options.body) });
      return path.endsWith("/patient-file") ? reply({ id: "88" }) : reply({ idEvent: "1000" });
    }
    throw new Error(`unexpected request ${path}`);
  };
  try {
    const result = await post({ action: "book", slot: { clinicId: "88", date: future.toISOString().slice(0, 10), time: "17:00", sourceEvent: "12345" }, patient: { name: "Bea Prueba", cedula: "987654321", phone: "88889999", email: "bea@example.com" } });
    assert.equal(result.status, 200);
    assert.equal(writes.length, 2);
    assert.equal(writes[0].body.personalData.patientIds[0].idNumber, "987654321");
    assert.equal(writes[1].body.id_patient_file, 88);
  } finally { globalThis.fetch = oldFetch; }
});
