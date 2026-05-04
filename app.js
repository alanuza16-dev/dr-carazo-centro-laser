const AREAS = {
  ginecologia: {
    label: "Ginecología",
    doctor: "Dr. Luis Diego Carazo",
    pin: "carazo2026",
    services: [
      "Consulta ginecológica",
      "IncontiLase FOTONA",
      "Labioplastía",
      "Hormonas bioidénticas",
      "Tratamiento LASER de displasia de cérvix"
    ],
    slots: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00"]
  },
  estetica: {
    label: "Estética LASER",
    doctor: "Esteticista profesional LASER FOTONA",
    pin: "laser2026",
    services: [
      "Valoración estética",
      "Tensado corporal y celulitis",
      "Rejuvenecimiento facial",
      "Depilación FOTONA"
    ],
    slots: ["09:00", "10:30", "12:00", "14:30", "16:00", "17:00"]
  }
};

const STORAGE_KEY = "lc-demo-agenda-v1";

const $ = (selector) => document.querySelector(selector);

const state = loadState();
let activeAdminArea = null;

document.addEventListener("DOMContentLoaded", () => {
  seedControls();
  setDefaultDates();
  renderServices();
  renderSlots();
  bindEvents();
});

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  const today = new Date();
  const plus = (days) => {
    const date = new Date(today);
    date.setDate(today.getDate() + days);
    return toDateInput(date);
  };

  const initial = {
    appointments: [
      {
        id: crypto.randomUUID(),
        area: "ginecologia",
        service: "IncontiLase FOTONA",
        date: plus(2),
        time: "09:00",
        name: "Paciente demo",
        phone: "+506 8888-0000",
        email: "paciente@demo.com",
        note: "Consulta inicial por pérdidas de orina al ejercicio.",
        status: "confirmada",
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        area: "estetica",
        service: "Rejuvenecimiento facial",
        date: plus(3),
        time: "14:30",
        name: "Cliente demo",
        phone: "+506 8777-0000",
        email: "cliente@demo.com",
        note: "Desea valoración facial.",
        status: "confirmada",
        createdAt: new Date().toISOString()
      }
    ],
    blocks: [
      {
        id: crypto.randomUUID(),
        area: "ginecologia",
        date: plus(4),
        time: "11:00",
        reason: "Procedimiento externo"
      },
      {
        id: crypto.randomUUID(),
        area: "estetica",
        date: plus(5),
        time: "16:00",
        reason: "Capacitación"
      }
    ]
  };
  saveState(initial);
  return initial;
}

function saveState(nextState = state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function seedControls() {
  const areaOptions = Object.entries(AREAS)
    .map(([value, area]) => `<option value="${value}">${area.label}</option>`)
    .join("");

  $("#booking-area").innerHTML = areaOptions;
  $("#admin-area").innerHTML = areaOptions;
  $("#block-time").innerHTML = AREAS.ginecologia.slots
    .map((time) => `<option value="${time}">${time}</option>`)
    .join("");
}

function setDefaultDates() {
  const today = toDateInput(new Date());
  $("#booking-date").min = today;
  $("#booking-date").value = today;
  $("#block-date").min = today;
  $("#block-date").value = today;
}

function bindEvents() {
  $("#booking-area").addEventListener("change", () => {
    renderServices();
    renderSlots();
  });
  $("#booking-service").addEventListener("change", renderSlots);
  $("#booking-date").addEventListener("change", renderSlots);
  $("#booking-time").addEventListener("change", syncSlotSelection);
  $("#booking-form").addEventListener("submit", createAppointment);
  $("#admin-login").addEventListener("click", loginAdmin);
  $("#admin-area").addEventListener("change", updateBlockTimesFromAdminSelection);
  $("#block-slot").addEventListener("click", blockSlot);
  $("#seed-reset").addEventListener("click", resetDemo);
}

function renderServices() {
  const area = $("#booking-area").value;
  $("#booking-service").innerHTML = AREAS[area].services
    .map((service) => `<option value="${service}">${service}</option>`)
    .join("");
}

function renderSlots() {
  const area = $("#booking-area").value;
  const date = $("#booking-date").value;
  const slots = AREAS[area].slots;
  const availability = slots.map((time) => getSlotStatus(area, date, time));
  const available = availability.filter((slot) => slot.status === "available");

  $("#booking-time").innerHTML = available.length
    ? available.map((slot) => `<option value="${slot.time}">${slot.time}</option>`).join("")
    : '<option value="">Sin espacios disponibles</option>';

  $("#availability-title").textContent = `${AREAS[area].label} · ${formatDate(date)}`;
  $("#slot-list").innerHTML = availability
    .map((slot) => {
      const label = slot.status === "available" ? "Disponible" : slot.status === "blocked" ? "Bloqueado" : "Ocupado";
      const className = slot.status === "available" ? "" : slot.status === "blocked" ? "is-blocked" : "is-taken";
      const detail = slot.detail ? `<small>${slot.detail}</small>` : "";
      return `<div class="slot ${className}"><strong>${slot.time}</strong><span>${label}</span>${detail}</div>`;
    })
    .join("");
}

function syncSlotSelection() {
  const selected = $("#booking-time").value;
  document.querySelectorAll(".slot").forEach((slot) => {
    slot.toggleAttribute("data-selected", slot.textContent.includes(selected));
  });
}

function getSlotStatus(area, date, time) {
  const appointment = state.appointments.find((item) => item.area === area && item.date === date && item.time === time && item.status !== "cancelada");
  if (appointment) return { time, status: "taken", detail: appointment.service };

  const block = state.blocks.find((item) => item.area === area && item.date === date && item.time === time);
  if (block) return { time, status: "blocked", detail: block.reason || "No disponible" };

  return { time, status: "available" };
}

function createAppointment(event) {
  event.preventDefault();
  const area = $("#booking-area").value;
  const date = $("#booking-date").value;
  const time = $("#booking-time").value;

  if (!time || getSlotStatus(area, date, time).status !== "available") {
    showMessage("booking-message", "Ese espacio ya no está disponible. Seleccione otro horario.", true);
    renderSlots();
    return;
  }

  state.appointments.push({
    id: crypto.randomUUID(),
    area,
    service: $("#booking-service").value,
    date,
    time,
    name: $("#patient-name").value.trim(),
    phone: $("#patient-phone").value.trim(),
    email: $("#patient-email").value.trim(),
    note: $("#patient-note").value.trim(),
    status: "confirmada",
    createdAt: new Date().toISOString()
  });

  saveState();
  event.target.reset();
  $("#booking-area").value = area;
  $("#booking-date").value = date;
  renderServices();
  renderSlots();
  showMessage("booking-message", `Cita confirmada para ${AREAS[area].label} el ${formatDate(date)} a las ${time}.`);
  if (activeAdminArea === area) renderAdmin();
}

function loginAdmin() {
  const area = $("#admin-area").value;
  const pin = $("#admin-pin").value.trim();

  if (pin !== AREAS[area].pin) {
    alert("PIN incorrecto para este perfil.");
    return;
  }

  activeAdminArea = area;
  $("#admin-panel").hidden = false;
  $("#admin-role").textContent = AREAS[area].doctor;
  $("#admin-title").textContent = `Agenda de ${AREAS[area].label}`;
  updateBlockTimesFromAdminSelection();
  renderAdmin();
}

function updateBlockTimesFromAdminSelection() {
  const area = activeAdminArea || $("#admin-area").value;
  $("#block-time").innerHTML = AREAS[area].slots
    .map((time) => `<option value="${time}">${time}</option>`)
    .join("");
}

function blockSlot() {
  if (!activeAdminArea) return;
  const date = $("#block-date").value;
  const time = $("#block-time").value;
  const status = getSlotStatus(activeAdminArea, date, time);

  if (status.status === "taken") {
    alert("No se puede bloquear un espacio que ya tiene una cita confirmada.");
    return;
  }

  if (status.status === "blocked") {
    alert("Ese espacio ya está bloqueado.");
    return;
  }

  state.blocks.push({
    id: crypto.randomUUID(),
    area: activeAdminArea,
    date,
    time,
    reason: $("#block-reason").value.trim() || "No disponible"
  });

  saveState();
  $("#block-reason").value = "";
  renderAdmin();
  renderSlots();
}

function renderAdmin() {
  const appointments = state.appointments
    .filter((item) => item.area === activeAdminArea)
    .sort(sortByDateTime);
  const activeAppointments = appointments.filter((item) => item.status !== "cancelada");
  const blocks = state.blocks
    .filter((item) => item.area === activeAdminArea)
    .sort(sortByDateTime);

  $("#admin-summary").innerHTML = [
    ["Citas activas", activeAppointments.length],
    ["Canceladas", appointments.length - activeAppointments.length],
    ["Bloqueos", blocks.length]
  ]
    .map(([label, value]) => `<div class="summary-item"><strong>${value}</strong><span>${label}</span></div>`)
    .join("");

  $("#appointment-list").innerHTML = appointments.length
    ? appointments.map(renderAppointmentItem).join("")
    : emptyState("No hay citas para esta área.");

  $("#block-list").innerHTML = blocks.length
    ? blocks.map(renderBlockItem).join("")
    : emptyState("No hay espacios bloqueados.");

  document.querySelectorAll("[data-cancel-appointment]").forEach((button) => {
    button.addEventListener("click", () => cancelAppointment(button.dataset.cancelAppointment));
  });
  document.querySelectorAll("[data-delete-block]").forEach((button) => {
    button.addEventListener("click", () => deleteBlock(button.dataset.deleteBlock));
  });
}

function renderAppointmentItem(item) {
  const inactive = item.status === "cancelada" ? " · cancelada" : "";
  const cancelButton = item.status === "cancelada"
    ? ""
    : `<button class="mini-button danger" data-cancel-appointment="${item.id}" type="button">Cancelar cita</button>`;

  return `
    <article class="admin-item">
      <strong>${formatDate(item.date)} · ${item.time}${inactive}</strong>
      <span>${item.name} · ${item.service}</span>
      <small>${item.phone} · ${item.email}</small>
      ${item.note ? `<small>${item.note}</small>` : ""}
      <div class="item-actions">${cancelButton}</div>
    </article>
  `;
}

function renderBlockItem(item) {
  return `
    <article class="admin-item">
      <strong>${formatDate(item.date)} · ${item.time}</strong>
      <span>${item.reason || "No disponible"}</span>
      <div class="item-actions">
        <button class="mini-button danger" data-delete-block="${item.id}" type="button">Liberar espacio</button>
      </div>
    </article>
  `;
}

function cancelAppointment(id) {
  const appointment = state.appointments.find((item) => item.id === id);
  if (!appointment) return;
  appointment.status = "cancelada";
  saveState();
  renderAdmin();
  renderSlots();
}

function deleteBlock(id) {
  const index = state.blocks.findIndex((item) => item.id === id);
  if (index === -1) return;
  state.blocks.splice(index, 1);
  saveState();
  renderAdmin();
  renderSlots();
}

function resetDemo() {
  localStorage.removeItem(STORAGE_KEY);
  const fresh = loadState();
  state.appointments = fresh.appointments;
  state.blocks = fresh.blocks;
  renderSlots();
  if (activeAdminArea) renderAdmin();
}

function sortByDateTime(a, b) {
  return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CR", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(year, month - 1, day));
}

function showMessage(id, message, isError = false) {
  const element = document.getElementById(id);
  element.textContent = message;
  element.style.color = isError ? "#9a3412" : "#126c64";
}

function emptyState(message) {
  return `<div class="admin-item"><small>${message}</small></div>`;
}
