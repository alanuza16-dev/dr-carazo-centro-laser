const HULI_API_BASE_URL = "https://api.huli.io/practice/v2";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get("mode") !== "diagnostics") {
    return json({ ok: true, message: "Use ?mode=diagnostics&query=valor para probar la conexion con Huli." });
  }

  const query = String(url.searchParams.get("query") || "").trim();
  const diagnostics = {
    ok: false,
    mode: "diagnostics",
    query,
    config: {
      hasHuliApiKey: Boolean(env.HULI_API_KEY),
      hasHuliOrganizationId: Boolean(env.HULI_ORGANIZATION_ID),
      hasHuliDoctorId: Boolean(env.HULI_DOCTOR_ID),
      hasOpenAiApiKey: Boolean(env.OPENAI_API_KEY)
    },
    steps: []
  };

  const huliConfigError = validateHuliConfig(env);
  if (huliConfigError) {
    diagnostics.steps.push({ step: "config", ok: false, message: huliConfigError });
    return json(diagnostics, 500);
  }

  try {
    const token = await getHuliToken(env);
    diagnostics.steps.push({ step: "auth", ok: true, message: "Autenticacion con Huli correcta." });

    if (!query) {
      diagnostics.ok = true;
      diagnostics.steps.push({ step: "query", ok: true, message: "Sin query de prueba. Agrega ?query=cedula o nombre para probar la busqueda." });
      return json(diagnostics);
    }

    const patientFiles = await searchHuliPatients(env, token, query);
    diagnostics.steps.push({
      step: "patient-search",
      ok: true,
      message: `Busqueda de expediente correcta. Coincidencias: ${patientFiles.length}.`,
      samplePatients: patientFiles.slice(0, 3).map(normalizeHuliPatient)
    });

    const appointments = await getHuliAppointmentsForPatients(env, token, patientFiles);
    const normalizedAppointments = appointments
      .map(normalizeHuliAppointment)
      .filter(Boolean)
      .filter((appointment) => !env.HULI_DOCTOR_ID || String(appointment.doctorId) === String(env.HULI_DOCTOR_ID));

    diagnostics.ok = true;
    diagnostics.steps.push({
      step: "appointments",
      ok: true,
      message: `Lectura de citas correcta. Citas filtradas: ${normalizedAppointments.length}.`,
      sampleAppointments: normalizedAppointments.slice(0, 5)
    });
    return json(diagnostics);
  } catch (error) {
    diagnostics.steps.push({ step: "runtime", ok: false, message: getSafeErrorMessage(error) });
    return json(diagnostics, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const query = String(body.query || "").trim();

    if (!query) {
      return json({ reply: "Necesito una cedula o un nombre completo para revisar la agenda." }, 400);
    }

    const huliConfigError = validateHuliConfig(env);
    if (huliConfigError) return json({ reply: huliConfigError }, 500);

    const token = await getHuliToken(env);
    const patientFiles = await searchHuliPatients(env, token, query);
    const appointments = await getHuliAppointmentsForPatients(env, token, patientFiles);
    const normalizedAppointments = appointments
      .map(normalizeHuliAppointment)
      .filter(Boolean)
      .filter((appointment) => !env.HULI_DOCTOR_ID || String(appointment.doctorId) === String(env.HULI_DOCTOR_ID));

    if (!env.OPENAI_API_KEY) {
      return json({ reply: buildDeterministicReply(patientFiles, normalizedAppointments) });
    }

    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-5.6",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [
                  "Eres el asistente de citas del Dr. Luis Diego Carazo.",
                  "Responde en espanol, breve y claro.",
                  "Usa solamente los pacientes y citas devueltos por Huli.",
                  "No des diagnosticos ni consejos medicos.",
                  "No muestres numeros de cedula completos.",
                  "Si no hay resultados, pide verificar la cedula o escribir el nombre completo."
                ].join(" ")
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  `Consulta del paciente: ${query}`,
                  `Pacientes encontrados en Huli: ${JSON.stringify(patientFiles.map(normalizeHuliPatient))}`,
                  `Citas encontradas en Huli: ${JSON.stringify(normalizedAppointments)}`
                ].join("\n")
              }
            ]
          }
        ]
      })
    });

    if (!openAIResponse.ok) {
      return json({ reply: buildDeterministicReply(patientFiles, normalizedAppointments) });
    }

    const payload = await openAIResponse.json();
    return json({ reply: extractOutputText(payload) || buildDeterministicReply(patientFiles, normalizedAppointments) });
  } catch (error) {
    return json({ reply: getSafeErrorMessage(error) }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

function validateHuliConfig(env) {
  if (!env.HULI_API_KEY) return "Falta configurar HULI_API_KEY para consultar citas en Huli.";
  if (!env.HULI_ORGANIZATION_ID) return "Falta configurar HULI_ORGANIZATION_ID para consultar citas en Huli.";
  return "";
}

async function getHuliToken(env) {
  const response = await fetch(`${HULI_API_BASE_URL}/authorization/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: env.HULI_API_KEY })
  });
  if (!response.ok) throw new Error(`huli-auth-failed:${response.status}`);

  const payload = await response.json();
  const token = payload?.data?.jwt;
  if (!token) throw new Error("huli-auth-missing-token");
  return token;
}

async function searchHuliPatients(env, token, query) {
  const url = new URL(`${HULI_API_BASE_URL}/patient-file`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", env.HULI_PATIENT_LIMIT || "3");
  url.searchParams.set("offset", "0");

  const response = await fetch(url, {
    headers: huliHeaders(env, token)
  });
  if (!response.ok) throw new Error(`huli-patient-search-failed:${response.status}`);

  const payload = await response.json();
  const patientFiles = Array.isArray(payload.patientFiles) ? payload.patientFiles : [];
  return patientFiles.filter((patient) => patientMatchesQuery(patient, query));
}

async function getHuliAppointmentsForPatients(env, token, patientFiles) {
  const from = new Date();
  from.setDate(from.getDate() - Number(env.HULI_LOOKBACK_DAYS || 0));
  const to = new Date();
  to.setDate(to.getDate() + Number(env.HULI_LOOKAHEAD_DAYS || 14));

  const appointmentsByPatient = await Promise.all(patientFiles.map(async (patient) => {
    const patientFileID = patient.id || patient.idPatientFile;
    if (!patientFileID) return [];

    const url = new URL(`${HULI_API_BASE_URL}/appointment/patient/${patientFileID}`);
    url.searchParams.set("from", from.toISOString());
    url.searchParams.set("to", to.toISOString());
    url.searchParams.set("limit", env.HULI_APPOINTMENT_LIMIT || "10");
    url.searchParams.set("offset", "0");

    const response = await fetch(url, {
      headers: huliHeaders(env, token)
    });
    if (!response.ok) return [];

    const payload = await response.json();
    const appointments = Array.isArray(payload.appointments) ? payload.appointments : [];
    return appointments.map((appointment) => ({ ...appointment, patientFile: patient }));
  }));

  return appointmentsByPatient.flat();
}

function huliHeaders(env, token) {
  return {
    "Authorization": `Bearer ${token}`,
    "id_organization": String(env.HULI_ORGANIZATION_ID)
  };
}

function normalizeHuliPatient(patient) {
  const personalData = patient.personalData || {};
  const patientIds = Array.isArray(personalData.patientIds) ? personalData.patientIds : [];
  return {
    id: patient.id || patient.idPatientFile,
    name: [personalData.firstName, personalData.lastName].filter(Boolean).join(" ").trim() || personalData.knownAs || "Paciente",
    cedula: maskIdentifier(patientIds[0]?.idNumber || "")
  };
}

function patientMatchesQuery(patient, query) {
  const normalizedQuery = normalizeText(query);
  const queryDigits = onlyDigits(query);
  const personalData = patient.personalData || {};
  const patientIds = Array.isArray(personalData.patientIds) ? personalData.patientIds : [];
  const name = normalizeText([personalData.firstName, personalData.lastName, personalData.knownAs].filter(Boolean).join(" "));

  if (queryDigits.length >= 6 && patientIds.some((id) => onlyDigits(id.idNumber) === queryDigits)) return true;
  return normalizedQuery.length >= 4 && name.includes(normalizedQuery);
}

function normalizeHuliAppointment(appointment) {
  const patient = normalizeHuliPatient(appointment.patientFile || {});
  return {
    id: appointment.idEvent || appointment.id,
    patientName: patient.name,
    patientCedula: patient.cedula,
    doctorId: appointment.idDoctor,
    clinicId: appointment.idClinic,
    status: appointment.statusAppointment,
    startDate: appointment.startDate,
    timeFrom: appointment.timeFrom,
    endDate: appointment.endDate,
    timeTo: appointment.timeTo
  };
}

function extractOutputText(payload) {
  if (payload.output_text) return payload.output_text;
  if (!Array.isArray(payload.output)) return "";
  return payload.output
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .map((content) => content.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function buildDeterministicReply(patientFiles, appointments) {
  if (!patientFiles.length) {
    return "No encontre pacientes en Huli con ese dato. Verifica la cedula o intenta con el nombre completo.";
  }

  if (!appointments.length) {
    return "Encontre el expediente en Huli, pero no encontre citas activas en el rango consultado.";
  }

  return appointments.map((item) => {
    return `${item.patientName}: cita en Huli el ${formatDate(item.startDate)} a las ${formatTime(item.timeFrom)}. Estado: ${item.status}.`;
  }).join(" ");
}

function maskIdentifier(value) {
  const digits = onlyDigits(value);
  if (digits.length <= 4) return digits;
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CR", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(year, month - 1, day));
}

function formatTime(value) {
  return String(value || "").slice(0, 5);
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function getSafeErrorMessage(error) {
  const message = error?.message || "";
  if (message.startsWith("huli-auth-failed")) {
    return "Huli rechazo la autenticacion. Revisa que HULI_API_KEY y HULI_ORGANIZATION_ID esten configurados correctamente.";
  }
  if (message === "huli-auth-missing-token") {
    return "Huli respondio sin token de acceso. Revisa la API key de Huli.";
  }
  if (message.startsWith("huli-patient-search-failed")) {
    return "Huli rechazo la busqueda de expediente. Revisa permisos de la API key para consultar patient-file.";
  }
  return "No pude revisar Huli en este momento. Intenta de nuevo en unos segundos.";
}
