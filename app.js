const AREAS = {
  ginecologia: {
    label: "Ginecología",
    doctor: "Dr. Luis Diego Carazo",
    pin: "carazo2026",
    password: "doctor2026",
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
    password: "laseradmin2026",
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
const SESSION_KEY = "lc-demo-session-v1";
const DEMO_USERS = {
  "ginecologia@drcarazo.demo": {
    type: "admin",
    area: "ginecologia",
    name: "Admin Ginecología",
    password: "doctor2026"
  },
  "estetica@drcarazo.demo": {
    type: "admin",
    area: "estetica",
    name: "Admin Estética",
    password: "laseradmin2026"
  }
};

const $ = (selector) => document.querySelector(selector);

const state = loadState();
let activeAdminArea = null;
let loginMode = "create";

document.addEventListener("DOMContentLoaded", () => {
  handleSectionNavigation();
  seedControls();
  setDefaultDates();
  hydrateSessionUI();
  renderAccountWidget();
  guardBookingPage();
  if ($("#booking-form")) {
    renderServices();
    renderSlots();
    renderAreaChoices();
    renderDateChoices();
  }
  if ($("#admin-panel")) {
    initAdminPage();
  }
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

  if ($("#booking-area")) $("#booking-area").innerHTML = areaOptions;
  if ($("#admin-area")) $("#admin-area").innerHTML = areaOptions;
  if ($("#block-time")) {
    $("#block-time").innerHTML = AREAS.ginecologia.slots
      .map((time) => `<option value="${time}">${time}</option>`)
      .join("");
  }
}

function setDefaultDates() {
  const today = toDateInput(new Date());
  if ($("#booking-date")) {
    $("#booking-date").min = today;
    $("#booking-date").value = today;
  }
  if ($("#block-date")) {
    $("#block-date").min = today;
    $("#block-date").value = today;
  }
}

function bindEvents() {
  if ($("#unified-login-form")) $("#unified-login-form").addEventListener("submit", loginUser);
  if ($("#admin-logout")) $("#admin-logout").addEventListener("click", logoutUser);
  if ($("#patient-logout")) $("#patient-logout").addEventListener("click", logoutUser);
  if ($("#booking-area")) $("#booking-area").addEventListener("change", () => {
    renderServices();
    renderSlots();
  });
  if ($("#booking-service")) $("#booking-service").addEventListener("change", renderSlots);
  if ($("#booking-date")) $("#booking-date").addEventListener("change", renderSlots);
  if ($("#booking-time")) $("#booking-time").addEventListener("change", syncSlotSelection);
  if ($("#booking-form")) $("#booking-form").addEventListener("submit", createAppointment);
  if ($("#area-choice")) $("#area-choice").addEventListener("click", handleAreaChoice);
  if ($("#service-choice")) $("#service-choice").addEventListener("click", handleServiceChoice);
  if ($("#date-choice")) $("#date-choice").addEventListener("click", handleDateChoice);
  if ($("#time-choice")) $("#time-choice").addEventListener("click", handleTimeChoice);
  if ($("#admin-area")) $("#admin-area").addEventListener("change", updateBlockTimesFromAdminSelection);
  if ($("#block-slot")) $("#block-slot").addEventListener("click", blockSlot);
  if ($("#seed-reset")) $("#seed-reset").addEventListener("click", resetDemo);
  if ($("#profile-menu-toggle")) $("#profile-menu-toggle").addEventListener("click", toggleProfileMenu);
  document.querySelectorAll("[data-video]").forEach((button) => {
    button.addEventListener("click", () => openVideoModal(button.dataset.video, button.dataset.title));
  });
  bindCarouselHover();
  if ($("#video-modal-close")) $("#video-modal-close").addEventListener("click", closeVideoModal);
  if ($("#video-modal")) $("#video-modal").addEventListener("click", (event) => {
    if (event.target.id === "video-modal") closeVideoModal();
  });
  document.addEventListener("click", closeProfileMenu);
}

function handleSectionNavigation() {
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") || window.location.hash.replace("#", "");
  if (!section) return;
  window.requestAnimationFrame(() => {
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", window.location.pathname);
  });
}

function hydrateSessionUI() {
  const session = getSession();
  if ($("#patient-welcome") && session?.type === "patient") {
    $("#patient-welcome").textContent = `Sesión de ${session.name}`;
    $("#patient-name").value = session.name || "";
    $("#patient-email").value = session.email || "";
  }
  renderLoginMode();
}

function guardBookingPage() {
  if (!$("#booking-form")) return;
  const session = getSession();
  const canBook = session?.type === "patient";
  const gate = $("#booking-auth-gate");
  const bookingLayout = $(".booking-layout");
  if (gate) gate.hidden = canBook;
  if (bookingLayout) bookingLayout.hidden = !canBook;
}

function renderAccountWidget() {
  const header = $(".site-header");
  if (!header || $("#account-widget")) return;
  const session = getSession();
  const wrapper = document.createElement("div");
  wrapper.className = "account-widget";
  wrapper.id = "account-widget";

  if (!session) {
    wrapper.innerHTML = '<a class="profile-link" href="login.html">Crear perfil</a>';
    header.appendChild(wrapper);
    return;
  }

  const adminLink = session.type === "admin" ? `<a href="admin.html?area=${session.area}">Panel</a>` : "";
  wrapper.innerHTML = `
    <button class="profile-orb" id="profile-menu-toggle" type="button" aria-label="Abrir perfil">
      ${getInitials(session.name)}
    </button>
    <div class="profile-menu" id="profile-menu" hidden>
      <strong>${session.name}</strong>
      <small>${session.type === "admin" ? AREAS[session.area].label : "Paciente"}</small>
      <a href="agenda.html">Agendar</a>
      ${adminLink}
      <button id="patient-logout" type="button">Salir</button>
    </div>
  `;
  header.appendChild(wrapper);
}

function renderServices() {
  const area = $("#booking-area").value;
  $("#booking-service").innerHTML = AREAS[area].services
    .map((service) => `<option value="${service}">${service}</option>`)
    .join("");
  renderAreaChoices();
  renderServiceChoices();
}

function renderSlots() {
  if (!$("#booking-area")) return;
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
  renderTimeChoices(availability);
}

function syncSlotSelection() {
  const selected = $("#booking-time").value;
  document.querySelectorAll(".slot").forEach((slot) => {
    slot.toggleAttribute("data-selected", slot.textContent.includes(selected));
  });
  document.querySelectorAll("[data-time-choice]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.timeChoice === selected);
  });
}

function renderAreaChoices() {
  if (!$("#area-choice") || !$("#booking-area")) return;
  const selected = $("#booking-area").value;
  $("#area-choice").innerHTML = Object.entries(AREAS).map(([value, area]) => `
    <button class="choice-card ${value === selected ? "is-selected" : ""}" type="button" data-area-choice="${value}">
      <strong>${area.label}</strong>
      <span>${value === "ginecologia" ? "Consulta médica y procedimientos" : "Centro LASER de estética"}</span>
    </button>
  `).join("");
}

function renderServiceChoices() {
  if (!$("#service-choice") || !$("#booking-service")) return;
  const selected = $("#booking-service").value;
  $("#service-choice").innerHTML = Array.from($("#booking-service").options).map((option) => `
    <button class="choice-pill ${option.value === selected ? "is-selected" : ""}" type="button" data-service-choice="${option.value}">
      ${option.value}
    </button>
  `).join("");
}

function renderDateChoices() {
  if (!$("#date-choice") || !$("#booking-date")) return;
  const selected = $("#booking-date").value;
  const today = new Date();
  const dates = Array.from({ length: 8 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return toDateInput(date);
  });
  $("#date-choice").innerHTML = dates.map((dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const dayName = new Intl.DateTimeFormat("es-CR", { weekday: "short" }).format(date);
    const monthName = new Intl.DateTimeFormat("es-CR", { month: "short" }).format(date);
    return `
      <button class="date-card ${dateString === selected ? "is-selected" : ""}" type="button" data-date-choice="${dateString}">
        <span>${dayName}</span>
        <strong>${day}</strong>
        <small>${monthName}</small>
      </button>
    `;
  }).join("");
}

function renderTimeChoices(availability = []) {
  if (!$("#time-choice")) return;
  const selected = $("#booking-time")?.value;
  const available = availability.filter((slot) => slot.status === "available");
  $("#time-choice").innerHTML = available.length
    ? available.map((slot) => `
      <button class="time-chip ${slot.time === selected ? "is-selected" : ""}" type="button" data-time-choice="${slot.time}">
        ${slot.time}
      </button>
    `).join("")
    : '<p class="empty-choice">Sin espacios disponibles para esta fecha.</p>';
}

function handleAreaChoice(event) {
  const button = event.target.closest("[data-area-choice]");
  if (!button) return;
  $("#booking-area").value = button.dataset.areaChoice;
  renderServices();
  renderSlots();
}

function handleServiceChoice(event) {
  const button = event.target.closest("[data-service-choice]");
  if (!button) return;
  $("#booking-service").value = button.dataset.serviceChoice;
  renderServiceChoices();
  renderSlots();
}

function handleDateChoice(event) {
  const button = event.target.closest("[data-date-choice]");
  if (!button) return;
  $("#booking-date").value = button.dataset.dateChoice;
  renderDateChoices();
  renderSlots();
}

function handleTimeChoice(event) {
  const button = event.target.closest("[data-time-choice]");
  if (!button) return;
  $("#booking-time").value = button.dataset.timeChoice;
  syncSlotSelection();
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
  const session = getSession();
  if (session?.type !== "patient") {
    showNotice("Primero crea tu perfil o inicia sesión para agendar.", true);
    window.setTimeout(() => {
      window.location.href = "login.html?next=agenda";
    }, 900);
    return;
  }
  const area = $("#booking-area").value;
  const date = $("#booking-date").value;
  const time = $("#booking-time").value;
  const phone = $("#patient-phone").value.trim();

  if (!time || getSlotStatus(area, date, time).status !== "available") {
    showMessage("booking-message", "Ese espacio ya no está disponible. Seleccione otro horario.", true);
    renderSlots();
    return;
  }

  if (!phone) {
    showNotice("Ingresá un teléfono para confirmar la cita.", true);
    $("#patient-phone").focus();
    return;
  }

  state.appointments.push({
    id: crypto.randomUUID(),
    area,
    service: $("#booking-service").value,
    date,
    time,
    name: session.name,
    phone,
    email: session.email,
    note: $("#patient-note").value.trim(),
    status: "confirmada",
    createdAt: new Date().toISOString()
  });

  saveState();
  event.target.reset();
  $("#booking-area").value = area;
  $("#booking-date").value = date;
  renderServices();
  renderDateChoices();
  renderSlots();
  showMessage("booking-message", `Cita confirmada para ${AREAS[area].label} el ${formatDate(date)} a las ${time}.`);
  if (activeAdminArea === area) renderAdmin();
}

function loginUser(event) {
  event.preventDefault();
  const name = $("#login-name")?.value.trim() || "";
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value.trim();
  const passwordConfirm = $("#login-password-confirm")?.value.trim() || "";

  if (!isValidEmail(email)) {
    showNotice("Ingresá un correo válido.", true);
    return;
  }

  if (password.length < 6) {
    showNotice("La contraseña debe tener al menos 6 caracteres.", true);
    return;
  }

  if (loginMode === "login") {
    const account = DEMO_USERS[email.toLowerCase()];
    if (account) {
      if (password !== account.password) {
        showNotice("Correo o contraseña incorrectos.", true);
        return;
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        type: account.type,
        area: account.area,
        name: account.name,
        email
      }));
      window.location.href = `admin.html?area=${account.area}`;
      return;
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ type: "patient", name: getNameFromEmail(email), email }));
    window.location.href = "agenda.html";
    return;
  }

  if (!name) {
    showNotice("Ingresá tu nombre completo para crear el perfil.", true);
    return;
  }

  if (password !== passwordConfirm) {
    showNotice("Las contraseñas no coinciden.", true);
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify({ type: "patient", name, email }));
  window.location.href = "agenda.html";
}

function toggleLoginMode(event) {
  event.preventDefault();
  loginMode = loginMode === "create" ? "login" : "create";
  renderLoginMode();
}

function renderLoginMode() {
  if (!$("#unified-login-form")) return;
  const isLogin = loginMode === "login";
  const tag = $("#unified-login-form .tag");
  const title = $("#unified-login-form h2");
  const nameField = $("#full-name-field");
  const confirmField = $("#confirm-password-field");
  const passwordInput = $("#login-password");
  const confirmInput = $("#login-password-confirm");

  if (tag) tag.textContent = isLogin ? "Ingresar" : "Crear perfil";
  if (title) title.textContent = isLogin ? "Ingresá a tu cuenta" : "Datos de acceso";
  if (nameField) nameField.hidden = isLogin;
  if (confirmField) confirmField.hidden = isLogin;
  if ($("#login-name")) $("#login-name").required = !isLogin;
  if (confirmInput) confirmInput.required = !isLogin;
  if (passwordInput) passwordInput.autocomplete = isLogin ? "current-password" : "new-password";
  if ($("#login-submit")) $("#login-submit").textContent = isLogin ? "Ingresar" : "Crear perfil";
  if ($("#login-switch")) {
    $("#login-switch").innerHTML = isLogin
      ? '¿No tenés cuenta? <a href="login.html" id="existing-account-link">Crear perfil</a>'
      : '¿Ya tenés una cuenta? <a href="login.html" id="existing-account-link">Ingresar</a>';
    $("#existing-account-link").addEventListener("click", toggleLoginMode);
  }
}

function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getNameFromEmail(email = "") {
  const localPart = email.split("@")[0] || "Paciente";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Paciente";
}

function bindCarouselHover() {
  const cards = document.querySelectorAll(".poster-card");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => setCarouselActive(card));
    card.addEventListener("focus", () => setCarouselActive(card));
    card.addEventListener("mouseleave", clearCarouselActive);
    card.addEventListener("blur", clearCarouselActive);
  });
}

function setCarouselActive(activeCard) {
  document.querySelectorAll(".poster-card").forEach((card) => {
    card.classList.toggle("is-active", card === activeCard);
    card.classList.toggle("is-muted", card !== activeCard);
  });
}

function clearCarouselActive() {
  document.querySelectorAll(".poster-card").forEach((card) => {
    card.classList.remove("is-active", "is-muted");
  });
}

function initAdminPage() {
  const session = getSession();
  const queryArea = new URLSearchParams(window.location.search).get("area");
  const area = queryArea || session?.area;

  if (!session || session.type !== "admin" || !AREAS[area]) {
    window.location.href = "login.html";
    return;
  }

  activeAdminArea = area;
  $("#admin-panel").hidden = false;
  $("#admin-role").textContent = AREAS[area].doctor;
  $("#admin-title").textContent = `Agenda de ${AREAS[area].label}`;
  updateBlockTimesFromAdminSelection();
  renderAdmin();
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

function toggleProfileMenu(event) {
  event.stopPropagation();
  const menu = $("#profile-menu");
  if (menu) menu.hidden = !menu.hidden;
}

function closeProfileMenu(event) {
  const widget = $("#account-widget");
  const menu = $("#profile-menu");
  if (!widget || !menu || widget.contains(event.target)) return;
  menu.hidden = true;
}

function getInitials(name = "") {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials || "LC";
}

function openVideoModal(videoId, title = "Video informativo") {
  const modal = $("#video-modal");
  const frame = $("#video-frame");
  const label = $("#video-modal-title");
  if (!modal || !frame || !videoId) return;
  frame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  if (label) label.textContent = title;
  modal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeVideoModal() {
  const modal = $("#video-modal");
  const frame = $("#video-frame");
  if (!modal || !frame) return;
  frame.src = "";
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function updateBlockTimesFromAdminSelection() {
  const area = activeAdminArea || $("#admin-area").value;
  if (!$("#block-time")) return;
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
    showNotice("No se puede bloquear un espacio que ya tiene una cita confirmada.", true);
    return;
  }

  if (status.status === "blocked") {
    showNotice("Ese espacio ya está bloqueado.", true);
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
  showNotice("Espacio bloqueado correctamente.");
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
  if (!element) return;
  element.textContent = message;
  element.style.color = isError ? "#9a3412" : "#9d4765";
  showNotice(message, isError);
}

function showNotice(message, isError = false) {
  let notice = $("#app-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "app-notice";
    notice.className = "app-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    document.body.appendChild(notice);
  }

  notice.innerHTML = `
    <span class="notice-mark" aria-hidden="true"></span>
    <span>${message}</span>
  `;
  notice.classList.toggle("is-error", isError);
  notice.classList.remove("is-visible");
  window.clearTimeout(notice.hideTimer);
  requestAnimationFrame(() => notice.classList.add("is-visible"));
  notice.hideTimer = window.setTimeout(() => {
    notice.classList.remove("is-visible");
  }, 3400);
}

function emptyState(message) {
  return `<div class="admin-item"><small>${message}</small></div>`;
}
