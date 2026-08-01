const HULI_API_BASE_URL = "https://api.huli.io/practice/v2";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 18;
const requestBuckets = new Map();

const KNOWLEDGE_BASE = [
  {
    topic: "IncontiLase FOTONA",
    keywords: ["incontilase", "incontinencia", "orina", "tos", "risa", "ejercicio", "laser vaginal"],
    answer: "IncontiLase FOTONA es un tratamiento ginecologico laser orientado a incontinencia urinaria de esfuerzo. El sitio lo presenta como una opcion medica no quirurgica, con sesiones cortas y sin tiempo de recuperacion habitual. La indicacion real debe confirmarla el doctor en consulta."
  },
  {
    topic: "Labioplastia",
    keywords: ["labioplastia", "labios", "asimetria", "intima", "comodidad"],
    answer: "La labioplastia se presenta como un procedimiento para mejorar comodidad, funcion y estetica intima cuando hay exceso de tejido o asimetria. Requiere valoracion medica para confirmar si aplica y explicar recuperacion, riesgos y expectativas."
  },
  {
    topic: "Hormonas bioidenticas",
    keywords: ["hormonas", "bioidenticas", "menopausia", "estradiol", "progesterona", "testosterona", "pellets"],
    answer: "La terapia con hormonas bioidenticas se usa en pacientes seleccionadas, especialmente en etapa de menopausia o sintomas asociados. Puede incluir estradiol, progesterona y, en algunos casos, testosterona. La dosis y via se definen solamente despues de valoracion medica."
  },
  {
    topic: "Displasia de cervix",
    keywords: ["displasia", "cervix", "cuello uterino", "vph", "papiloma", "verrugas"],
    answer: "El tratamiento laser de displasia de cervix se menciona para lesiones de bajo grado asociadas a VPH. Antes de cualquier procedimiento se necesita diagnostico, estudios y criterio del especialista."
  },
  {
    topic: "Agenda Huli",
    keywords: ["cita", "agenda", "huli", "agendar", "horario", "cancelar", "confirmar"],
    answer: "Para agendar una cita nueva se usa la agenda oficial de Huli del Dr. Carazo. Para revisar si existe una cita, usa el modo Cita y escribe la cedula con solo numeros; guiones y espacios se limpian automaticamente."
  },
  {
    topic: "Relacion con Jenny Delgado",
    keywords: ["jenny", "estetica", "facial", "corporal", "depilacion", "centro estetica"],
    answer: "Los servicios esteticos faciales y corporales se manejan en el sitio separado de Jenny Delgado Centro de Estetica Laser. El sitio del Dr. Carazo mantiene el enfoque ginecologico y enlaza hacia Jenny cuando corresponde."
  }
];

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get("mode") !== "diagnostics") {
    return json({ ok: true, message: "Sofi esta activa." });
  }

  if (!canUseDiagnostics(url, env)) {
    return json({ ok: false, message: "Diagnostico protegido." }, 403);
  }

  const rawQuery = String(url.searchParams.get("query") || "").trim();
  const query = normalizeCedulaInput(rawQuery);
  const diagnostics = {
    ok: false,
    mode: "diagnostics",
    query: rawQuery ? maskIdentifier(query) : "",
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

    if (rawQuery && hasLetters(rawQuery)) {
      diagnostics.steps.push({
        step: "query",
        ok: false,
        message: "La cedula de prueba no es valida. Usa solo numeros; guiones y espacios se limpian automaticamente."
      });
      return json(diagnostics, 400);
    }

    if (!query) {
      diagnostics.ok = true;
      diagnostics.steps.push({ step: "query", ok: true, message: "Sin cedula de prueba." });
      return json(diagnostics);
    }

    const patientFiles = await searchHuliPatients(env, token, query);
    diagnostics.steps.push({
      step: "patient-search",
      ok: true,
      message: `Busqueda de expediente correcta. Coincidencias: ${patientFiles.length}.`,
      samplePatients: patientFiles.slice(0, 3).map(normalizeHuliPatient)
    });

    const appointmentLookup = await getHuliAppointments(env, token, patientFiles);
    const normalizedAppointments = appointmentLookup.appointments.map(normalizeHuliAppointment).filter(Boolean);
    diagnostics.ok = true;
    diagnostics.steps.push({
      step: "appointments",
      ok: true,
      strategy: appointmentLookup.strategy,
      message: `Lectura de citas correcta por ${appointmentLookup.strategy}. Citas filtradas: ${normalizedAppointments.length}.`,
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
    if (!rateLimit(request)) {
      return json({ reply: "Recibi muchas consultas seguidas. Intenta otra vez en un minuto." }, 429);
    }

    const body = await parseJsonBody(request);
    const mode = body.mode === "info" ? "info" : "appointment";
    const rawValue = String(body.query || body.message || "").trim();

    if (mode === "info") {
      return answerInfoQuestion(rawValue, env);
    }

    if (hasLetters(rawValue)) {
      return json({ reply: "Ese dato no parece una cedula valida. Ingresa solo numeros; guiones y espacios se limpian automaticamente." }, 400);
    }

    const query = normalizeCedulaInput(rawValue);
    if (!query) return json({ reply: "Necesito un numero de cedula para revisar la agenda." }, 400);
    if (query.length < 7) return json({ reply: "La cedula parece incompleta. Revisa el numero e intenta de nuevo." }, 400);

    const huliConfigError = validateHuliConfig(env);
    if (huliConfigError) return json({ reply: huliConfigError }, 500);

    const token = await getHuliToken(env);
    const patientFiles = await searchHuliPatients(env, token, query);
    const appointmentLookup = await getHuliAppointments(env, token, patientFiles);
    const normalizedAppointments = appointmentLookup.appointments.map(normalizeHuliAppointment).filter(Boolean);

    if (!env.OPENAI_API_KEY) {
      return json({ reply: buildDeterministicAppointmentReply(patientFiles, normalizedAppointments) });
    }

    const prompt = [
      `Cedula consultada: ${maskIdentifier(query)}`,
      `Pacientes encontrados: ${JSON.stringify(patientFiles.map(normalizeHuliPatient))}`,
      `Estrategia de citas: ${appointmentLookup.strategy}`,
      `Citas encontradas: ${JSON.stringify(normalizedAppointments)}`
    ].join("\n");

    const reply = await askOpenAI(env, [
      "Eres Sofi, asistente de agenda del Dr. Luis Diego Carazo.",
      "Responde en espanol claro, breve y humano.",
      "Usa solamente los datos devueltos por Huli.",
      "No diagnostiques, no recomiendes tratamientos y no muestres cedulas completas.",
      "Si no hay citas, indica que se encontro el expediente si aplica y recomienda abrir Huli para agendar."
    ].join(" "), prompt);

    return json({ reply: reply || buildDeterministicAppointmentReply(patientFiles, normalizedAppointments) });
  } catch (error) {
    return json({ reply: getSafeErrorMessage(error) }, error.status || 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    const invalidJson = new Error("invalid-json-body");
    invalidJson.status = 400;
    throw invalidJson;
  }
}

async function answerInfoQuestion(rawQuestion, env) {
  const question = normalizeText(rawQuestion);
  if (!question) return json({ reply: "Escribe una pregunta sobre los servicios del Dr. Carazo." }, 400);

  const matches = KNOWLEDGE_BASE
    .map((item) => ({
      item,
      score: item.keywords.reduce((total, keyword) => total + (question.includes(normalizeText(keyword)) ? 1 : 0), 0)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((entry) => entry.item);

  if (!matches.length) {
    return json({
      reply: "Puedo responder sobre IncontiLase, labioplastia, hormonas bioidenticas, displasia de cervix y agenda Huli. Para sintomas o decisiones medicas, lo correcto es valoracion con el doctor."
    });
  }

  if (!env.OPENAI_API_KEY) {
    return json({ reply: matches.map((item) => item.answer).join(" ") });
  }

  const reply = await askOpenAI(env, [
    "Eres Sofi, asistente informativa del sitio del Dr. Luis Diego Carazo.",
    "Responde solo con base en el contenido aprobado.",
    "No diagnostiques, no indiques tratamientos personalizados, no inventes precios ni disponibilidad.",
    "Cuando corresponda, invita a agendar en Huli o consultar con el doctor."
  ].join(" "), [
    `Pregunta: ${rawQuestion}`,
    `Contenido aprobado: ${JSON.stringify(matches.map(({ topic, answer }) => ({ topic, answer })))}`
  ].join("\n"));

  return json({ reply: reply || matches.map((item) => item.answer).join(" ") });
}

async function askOpenAI(env, instructions, userInput) {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-5-mini",
      input: [
        { role: "system", content: [{ type: "input_text", text: instructions }] },
        { role: "user", content: [{ type: "input_text", text: userInput }] }
      ]
    })
  });

  if (!response.ok) return "";
  const payload = await response.json();
  return extractOutputText(payload);
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

  const response = await fetch(url, { headers: huliHeaders(env, token) });
  if (!response.ok) throw new Error(`huli-patient-search-failed:${response.status}`);

  const payload = await response.json();
  const patientFiles = Array.isArray(payload.patientFiles) ? payload.patientFiles : [];
  return patientFiles.filter((patient) => patientMatchesQuery(patient, query));
}

async function getHuliAppointments(env, token, patientFiles) {
  if (!patientFiles.length) return { strategy: "patient-file-empty", appointments: [] };

  try {
    const patientAppointments = await getHuliAppointmentsForPatients(env, token, patientFiles);
    return {
      strategy: "patient-appointments",
      appointments: filterAppointmentsForPatientFiles(env, patientAppointments, patientFiles)
    };
  } catch (error) {
    if (error.status !== 403) throw error;
  }

  const doctorAppointments = await getHuliAppointmentsForDoctor(env, token);
  return {
    strategy: "doctor-appointments-fallback",
    appointments: filterAppointmentsForPatientFiles(env, doctorAppointments, patientFiles)
  };
}

async function getHuliAppointmentsForPatients(env, token, patientFiles) {
  const { from, to } = getAppointmentRange(env);
  const lookups = patientFiles.map(async (patient) => {
    const patientFileID = patient.id || patient.idPatientFile;
    if (!patientFileID) return [];

    const url = new URL(`${HULI_API_BASE_URL}/appointment/patient/${patientFileID}`);
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);
    url.searchParams.set("limit", env.HULI_APPOINTMENT_LIMIT || "10");
    url.searchParams.set("offset", "0");

    const response = await fetch(url, { headers: huliHeaders(env, token) });
    if (!response.ok) {
      const error = new Error(`huli-patient-appointments-failed:${response.status}`);
      error.status = response.status;
      throw error;
    }

    const payload = await response.json();
    const appointments = Array.isArray(payload.appointments) ? payload.appointments : [];
    return appointments.map((appointment) => ({ ...appointment, patientFile: patient }));
  });
  return (await Promise.all(lookups)).flat();
}

async function getHuliAppointmentsForDoctor(env, token) {
  if (!env.HULI_DOCTOR_ID) throw new Error("huli-doctor-id-missing");
  const { from, to } = getAppointmentRange(env);
  const url = new URL(`${HULI_API_BASE_URL}/appointment/doctor/${env.HULI_DOCTOR_ID}`);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("limit", env.HULI_DOCTOR_APPOINTMENT_LIMIT || env.HULI_APPOINTMENT_LIMIT || "80");
  url.searchParams.set("offset", "0");

  const response = await fetch(url, { headers: huliHeaders(env, token) });
  if (!response.ok) throw new Error(`huli-doctor-appointments-failed:${response.status}`);

  const payload = await response.json();
  return Array.isArray(payload.appointments) ? payload.appointments : [];
}

function filterAppointmentsForPatientFiles(env, appointments, patientFiles) {
  const patientFileIds = new Set(patientFiles.map((patient) => String(patient.id || patient.idPatientFile)));
  return appointments.filter((appointment) => {
    const idPatientFile = appointment.idPatientFile || appointment.patientFile?.id || appointment.patientFile?.idPatientFile;
    const patientMatch = patientFileIds.has(String(idPatientFile));
    const doctorMatch = !env.HULI_DOCTOR_ID || !appointment.idDoctor || String(appointment.idDoctor) === String(env.HULI_DOCTOR_ID);
    return patientMatch && doctorMatch;
  });
}

function getAppointmentRange(env) {
  const from = new Date();
  from.setDate(from.getDate() - Number(env.HULI_LOOKBACK_DAYS || 0));
  const to = new Date();
  to.setDate(to.getDate() + Number(env.HULI_LOOKAHEAD_DAYS || 14));
  return { from: from.toISOString(), to: to.toISOString() };
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
  const queryDigits = onlyDigits(query);
  const personalData = patient.personalData || {};
  const patientIds = Array.isArray(personalData.patientIds) ? personalData.patientIds : [];
  return queryDigits.length >= 6 && patientIds.some((id) => onlyDigits(id.idNumber) === queryDigits);
}

function normalizeHuliAppointment(appointment) {
  const patient = normalizeHuliPatient(appointment.patientFile || {});
  return {
    id: appointment.idEvent || appointment.id,
    patientName: patient.name,
    patientCedula: patient.cedula,
    status: appointment.statusAppointment || appointment.status,
    startDate: appointment.startDate,
    timeFrom: appointment.timeFrom,
    endDate: appointment.endDate,
    timeTo: appointment.timeTo
  };
}

function buildDeterministicAppointmentReply(patientFiles, appointments) {
  if (!patientFiles.length) {
    return "No encontre un expediente en Huli con esa cedula. Verifica el numero o abre la agenda Huli para coordinar la cita.";
  }
  if (!appointments.length) {
    return "Encontre el expediente en Huli, pero no encontre citas activas en el rango consultado. Puedes abrir la agenda Huli para agendar o confirmar disponibilidad.";
  }
  return appointments.map((item) => {
    return `${item.patientName}: cita en Huli el ${formatDate(item.startDate)} a las ${formatTime(item.timeFrom)}. Estado: ${item.status || "registrada"}.`;
  }).join(" ");
}

function canUseDiagnostics(url, env) {
  if (String(env.ENABLE_DIAGNOSTICS || "").toLowerCase() === "true") return true;
  const expectedToken = String(env.DIAGNOSTICS_TOKEN || "");
  return Boolean(expectedToken) && url.searchParams.get("token") === expectedToken;
}

function rateLimit(request) {
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "local";
  const now = Date.now();
  const bucket = requestBuckets.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }
  bucket.count += 1;
  requestBuckets.set(ip, bucket);
  return bucket.count <= RATE_LIMIT_MAX;
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

function normalizeCedulaInput(value) {
  return String(value || "").replace(/\D/g, "");
}

function hasLetters(value) {
  return /[A-Za-z]/.test(String(value || ""));
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-").map(Number);
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
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    return "Huli rechazo la busqueda de expediente. Revisa permisos de la API key para consultar expedientes.";
  }
  if (message === "huli-doctor-id-missing") {
    return "Falta configurar HULI_DOCTOR_ID para consultar citas por doctor.";
  }
  if (message.startsWith("huli-doctor-appointments-failed")) {
    return "Huli rechazo la lectura de citas por doctor. Hay que habilitar permisos de agenda para la API key.";
  }
  if (message === "invalid-json-body") {
    return "La solicitud del chat no tiene un formato valido. Intenta de nuevo.";
  }
  return "No pude revisar Huli en este momento. Intenta de nuevo en unos segundos.";
}
