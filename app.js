const HULI_SCHEDULE_URL = "https://widgets.hulilabs.com/es/doctor/calendars?wid=dc0&did=542";
const CHAT_API_URL = "/api/appointment-chat";
const chatFlow = { step: "idle", slot: null, slots: [], visibleSlots: 0, patient: {}, lookupCedula: "", busy: false };

const QUICK_TOPICS = [
  "IncontiLase",
  "Labioplastía",
  "Hormonas bioidénticas",
  "Displasia de cérvix",
  "Infografías"
];

const NEEDS = {
  orina: {
    count: "01",
    title: "IncontiLase FOTONA",
    copy: "Información para mujeres con pérdidas de orina al toser, reír, saltar o hacer ejercicio.",
    image: "assets/incontilase-fotona-system.jpg",
    alt: "Equipo Fotona utilizado para procedimientos ginecológicos láser",
    visualClass: "need-visual-orina",
    visualTitle: "IncontiLase",
    visualMeta: "Pérdidas al esfuerzo",
    links: [
      { label: "Ver IncontiLase", href: "ginecologia.html#incontilase" },
      { label: "Preguntar a Sofi", chat: true }
    ]
  },
  intima: {
    count: "02",
    title: "Salud íntima femenina",
    copy: "Orientación sobre sequedad vaginal, dolor durante relaciones, incomodidad y medicina regenerativa ginecológica.",
    image: "assets/incontilase-fotona-system.jpg",
    alt: "Equipo Fotona relacionado con procedimientos de salud íntima femenina",
    visualClass: "need-visual-intima",
    visualTitle: "Salud íntima",
    visualMeta: "Valoración individual",
    links: [
      { label: "Ver salud íntima", href: "ginecologia.html#procedimientos" },
      { label: "Agendar valoración", href: "https://widgets.hulilabs.com/es/doctor/calendars?wid=dc0&did=542" }
    ]
  },
  hormonas: {
    count: "03",
    title: "Menopausia y hormonas",
    copy: "Información general sobre estradiol, progesterona y eventualmente testosterona en terapia con hormonas bioidénticas.",
    image: "assets/dr-luis-diego-carazo-premium.png",
    alt: "Retrato del Dr. Luis Diego Carazo",
    visualClass: "need-visual-hormonas",
    visualTitle: "Balance hormonal",
    visualMeta: "Valoración médica",
    links: [
      { label: "Ver hormonas", href: "ginecologia.html#procedimientos" },
      { label: "Preguntar a Sofi", chat: true }
    ]
  },
  procedimientos: {
    count: "04",
    title: "Procedimientos ginecológicos",
    copy: "Labioplastía y tratamiento láser de displasia de cérvix como procedimientos que requieren indicación clínica.",
    image: "assets/incontilase-fotona-system.jpg",
    alt: "Equipo Fotona usado como referencia tecnológica para procedimientos ginecológicos",
    visualClass: "need-visual-procedimientos",
    visualTitle: "Procedimientos",
    visualMeta: "Procedimientos",
    links: [
      { label: "Ver procedimientos", href: "ginecologia.html#procedimientos" },
      { label: "Agendar", href: "https://widgets.hulilabs.com/es/doctor/calendars?wid=dc0&did=542" }
    ]
  },
  general: {
    count: "05",
    title: "Infografías",
    copy: "Información resumida, útil y sencilla sobre infecciones vaginales, ejercicios de Kegel y salud íntima femenina.",
    image: "assets/dr-luis-diego-carazo-premium.png",
    alt: "Retrato del Dr. Luis Diego Carazo",
    visualClass: "need-visual-general",
    visualTitle: "Infografías",
    visualMeta: "Salud femenina",
    links: [
      { label: "Ver infografías", href: "articulos.html" },
      { label: "Preguntar a Sofi", chat: true }
    ]
  }
};

const $ = (selector) => document.querySelector(selector);
const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
let lastMenuTrigger = null;

document.addEventListener("DOMContentLoaded", () => {
  ensureMobileMenuStructure();
  renderAppointmentChatWidget();
  bindNavigation();
  bindFaq();
  bindVideos();
  bindNeedFinder();
  bindOpenChatButtons();
  bindHeaderScroll();
  initReveal();
});

function ensureMobileMenuStructure() {
  const nav = $("#main-nav");
  const button = $("#mobile-menu-toggle");
  if (!nav || !button) return;

  button.setAttribute("aria-label", "Abrir menú");
  if (!button.querySelector("span")) {
    button.textContent = "";
    button.insertAdjacentHTML("beforeend", '<span aria-hidden="true"></span><span aria-hidden="true"></span>');
  }

  if (!nav.querySelector(".desktop-nav")) {
    const desktopNav = document.createElement("div");
    desktopNav.className = "desktop-nav";
    Array.from(nav.children).forEach((child) => desktopNav.appendChild(child));
    nav.appendChild(desktopNav);
  }

  if (!nav.querySelector(".mobile-menu-shell")) {
    nav.insertAdjacentHTML("beforeend", `
      <div class="mobile-menu-shell" aria-label="Menú móvil">
        <div class="mobile-menu-head">
          <div>
            <span class="brand-mark">LC</span>
            <strong>Dr. Carazo</strong>
            <small>Agenda y ginecología láser</small>
          </div>
          <button class="mobile-menu-close" type="button" data-close-menu aria-label="Cerrar menú">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
        </div>
        <button class="mobile-menu-cta" type="button" data-open-chat data-close-menu>
          <span>Agenda</span>
          <strong>Abrir asistente de citas</strong>
          <small>Consultar por cédula con Sofi</small>
        </button>
        <div class="mobile-menu-links">
          ${mobileMenuLink("index.html", "01", "Inicio", "Vista principal")}
          ${mobileMenuLink("ginecologia.html", "02", "Tratamientos", "Servicios ginecológicos")}
          ${mobileMenuLink("ginecologia.html#incontilase", "03", "Tecnología Fotona", "IncontiLase y láser")}
          ${mobileMenuLink("index.html#necesidades", "04", "Orientación", "Buscar por necesidad")}
          ${mobileMenuLink("faq.html", "05", "FAQ", "Preguntas frecuentes")}
          ${mobileMenuLink("articulos.html", "06", "Artículos", "Lecturas aprobadas")}
        </div>
        <div class="mobile-menu-secondary">
          <a href="https://jennydelgadocentroesteticalaser.adminlanzah.workers.dev/" data-close-menu>Centro LASER de Estética</a>
          <a href="https://widgets.hulilabs.com/es/doctor/calendars?wid=dc0&did=542" data-close-menu>Agendar cita</a>
        </div>
      </div>
    `);
  }
}

function mobileMenuLink(href, number, title, meta) {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const targetPath = href.split("#")[0] || "index.html";
  const targetHash = href.includes("#") ? `#${href.split("#")[1]}` : "";
  const current = currentPath === targetPath && window.location.hash === targetHash ? ' aria-current="page"' : "";
  return `<a href="${href}"${current} data-close-menu><span>${number}</span><strong>${title}</strong><small>${meta}</small></a>`;
}

function bindNavigation() {
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") || window.location.hash.replace("#", "");
  if (section) {
    window.requestAnimationFrame(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (params.get("section")) window.history.replaceState(null, "", window.location.pathname);
    });
  }

  const nav = $("#main-nav");
  const button = $("#mobile-menu-toggle");
  button?.addEventListener("click", toggleMobileMenu);
  nav?.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-close-menu]");
    if (event.target === nav) {
      closeMobileMenu({ restoreFocus: false });
      return;
    }
    if (!closeTarget) return;
    if (handleMobileHashNavigation(closeTarget, event)) return;
    closeMobileMenu({ restoreFocus: false });
  });
  nav?.addEventListener("keydown", trapMobileMenuFocus);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("nav-open")) closeMobileMenu();
    if (event.key === "Escape" && document.body.classList.contains("chat-open")) closeAppointmentChat();
  });
  window.addEventListener("pageshow", () => closeMobileMenu({ restoreFocus: false }));
  window.addEventListener("hashchange", () => closeMobileMenu({ restoreFocus: false }));
}

function toggleMobileMenu() {
  const nav = $("#main-nav");
  if (!nav?.hasAttribute("data-open")) return openMobileMenu();
  closeMobileMenu();
}

function openMobileMenu() {
  const nav = $("#main-nav");
  const button = $("#mobile-menu-toggle");
  if (!nav || !button) return;
  lastMenuTrigger = document.activeElement;
  resetMobileMenuPanel(nav);
  nav.setAttribute("data-open", "");
  button.setAttribute("aria-expanded", "true");
  button.setAttribute("aria-label", "Cerrar menú");
  document.body.classList.add("nav-open");
  window.requestAnimationFrame(() => nav.querySelector("[data-close-menu], a[href], button")?.focus());
}

function closeMobileMenu(options = {}) {
  const nav = $("#main-nav");
  const button = $("#mobile-menu-toggle");
  if (!nav || !button) return;
  nav.removeAttribute("data-open");
  resetMobileMenuPanel(nav);
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "Abrir menú");
  document.body.classList.remove("nav-open");
  if (nav.contains(document.activeElement)) document.activeElement.blur();
  if (options.restoreFocus !== false) (lastMenuTrigger || button).focus?.();
}

function resetMobileMenuPanel(nav) {
  nav.scrollTop = 0;
  const shell = nav.querySelector(".mobile-menu-shell");
  if (shell) shell.scrollTop = 0;
}

function handleMobileHashNavigation(target, event) {
  const link = target.closest("a[href]");
  if (!link) return false;
  const destination = new URL(link.getAttribute("href"), window.location.href);
  const samePage = destination.origin === window.location.origin && destination.pathname === window.location.pathname;
  if (!samePage || !destination.hash) return false;
  const section = document.querySelector(destination.hash);
  if (!section) return false;
  event.preventDefault();
  closeMobileMenu({ restoreFocus: false });
  window.history.pushState(null, "", destination.hash);
  window.requestAnimationFrame(() => {
    const headerHeight = $(".site-header")?.getBoundingClientRect().height || 0;
    const top = section.getBoundingClientRect().top + window.scrollY - headerHeight - 18;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  });
  return true;
}

function trapMobileMenuFocus(event) {
  if (event.key !== "Tab" || !document.body.classList.contains("nav-open")) return;
  const nav = $("#main-nav");
  const items = Array.from(nav?.querySelectorAll(focusableSelector) || [])
    .filter((item) => item.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function bindHeaderScroll() {
  const header = $(".site-header");
  if (!header) return;
  const sync = () => header.toggleAttribute("data-condensed", window.scrollY > 28);
  sync();
  window.addEventListener("scroll", sync, { passive: true });
}

function bindNeedFinder() {
  document.querySelectorAll("[data-need]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-need]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderNeed(button.dataset.need);
    });
  });
}

function renderNeed(key) {
  const item = NEEDS[key] || NEEDS.orina;
  const visual = $("#need-visual");
  const count = $("#need-count");
  const title = $("#need-title");
  const copy = $("#need-copy");
  const links = $("#need-links");
  if (visual) {
    visual.className = `need-visual ${item.visualClass || ""}`.trim();
    visual.setAttribute("aria-label", item.alt || item.title);
    visual.innerHTML = `<span>${item.count}</span><strong>${item.visualTitle || item.title}</strong><em>${item.visualMeta || ""}</em>`;
  }
  if (count) count.textContent = item.count;
  if (title) title.textContent = item.title;
  if (copy) copy.textContent = item.copy;
  if (links) {
    links.innerHTML = item.links.map((link) => {
      if (link.chat) return `<button type="button" data-open-chat>${link.label}</button>`;
      return `<a href="${link.href}">${link.label}</a>`;
    }).join("");
    bindOpenChatButtons(links);
  }
}

function bindOpenChatButtons(root = document) {
  root.querySelectorAll("[data-open-chat]").forEach((button) => {
    if (button.dataset.boundChat === "true") return;
    button.dataset.boundChat = "true";
    button.addEventListener("click", openAppointmentChat);
  });
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });
  items.forEach((item) => observer.observe(item));
}

function bindFaq() {
  document.querySelectorAll("[data-faq]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      const expanded = item?.hasAttribute("data-open");
      document.querySelectorAll(".faq-item").forEach((node) => node.removeAttribute("data-open"));
      if (item && !expanded) item.setAttribute("data-open", "");
    });
  });
}

function bindVideos() {
  document.querySelectorAll("[data-video]").forEach((button) => {
    button.addEventListener("click", () => openVideoModal(button.dataset.video, button.dataset.title));
  });
  $("#video-modal-close")?.addEventListener("click", closeVideoModal);
  $("#video-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "video-modal") closeVideoModal();
  });
}

function renderAppointmentChatWidget() {
  if ($("#appointment-chat")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <aside class="appointment-chat" id="appointment-chat" aria-label="Asistente Sofi">
      <button class="chat-fab" id="appointment-chat-toggle" type="button" aria-expanded="false" aria-controls="appointment-chat-panel">
        <img class="chat-avatar" src="assets/sofi-chat-avatar.svg" alt="" aria-hidden="true">
        <span>Sofi</span>
      </button>
      <div class="chat-panel" id="appointment-chat-panel" hidden>
        <div class="chat-panel-header">
          <span class="tag">Asistente del Dr. Carazo</span>
          <button class="icon-button text-close" id="appointment-chat-close" type="button" aria-label="Cerrar asistente">Cerrar</button>
        </div>
        <h3>Conversemos</h3>
        <div class="chat-intent-actions" aria-label="Opciones principales de Sofi">
          <button type="button" data-chat-intent="schedule">Agendar cita</button>
          <button type="button" data-chat-intent="appointment">Revisar cita</button>
          <button type="button" data-chat-intent="info">Información básica</button>
        </div>
        <div class="chat-messages" id="appointment-chat-messages" aria-live="polite">
          <div class="chat-message bot">Hola, soy Sofi. Puedes preguntarme por los servicios, consultar una cita o reservar un espacio con el Dr. Carazo. ¿Qué necesitas?</div>
        </div>
        <form class="chat-form" id="appointment-chat-form">
          <label>
            <span class="sr-only" id="chat-input-label">Tu mensaje</span>
            <input id="appointment-chat-query" type="text" autocomplete="off" maxlength="500" placeholder="Escribe tu mensaje..." required>
          </label>
          <button class="button primary wide" type="submit">Enviar</button>
        </form>
        <div class="chat-actions">
          <a class="chat-huli-link" href="${HULI_SCHEDULE_URL}" rel="noopener">Abrir calendario completo de Huli</a>
        </div>
        <small>Sofi ofrece información general y consulta la agenda de Huli. No sustituye una valoración médica.</small>
      </div>
    </aside>
  `);

  $("#appointment-chat-toggle")?.addEventListener("click", toggleAppointmentChat);
  $("#appointment-chat-close")?.addEventListener("click", closeAppointmentChat);
  $("#appointment-chat-form")?.addEventListener("submit", submitAppointmentChat);
  document.querySelectorAll("[data-chat-intent]").forEach((button) => {
    button.addEventListener("click", () => handleChatIntent(button.dataset.chatIntent));
  });
}

function toggleAppointmentChat() {
  const panel = $("#appointment-chat-panel");
  const button = $("#appointment-chat-toggle");
  if (!panel || !button) return;
  panel.hidden = !panel.hidden;
  button.setAttribute("aria-expanded", String(!panel.hidden));
  document.body.classList.toggle("chat-open", !panel.hidden);
}

function openAppointmentChat() {
  const panel = $("#appointment-chat-panel");
  const button = $("#appointment-chat-toggle");
  if (!panel || !button) return;
  panel.hidden = false;
  button.setAttribute("aria-expanded", "true");
  document.body.classList.add("chat-open");
  $("#appointment-chat-query")?.focus();
}

function closeAppointmentChat() {
  const panel = $("#appointment-chat-panel");
  const button = $("#appointment-chat-toggle");
  if (!panel || !button) return;
  panel.hidden = true;
  button.setAttribute("aria-expanded", "false");
  document.body.classList.remove("chat-open");
}

function handleChatIntent(intent) {
  if (intent === "info") {
    appendChatMessage("Quiero información básica", "user");
    resetChatFlow();
    appendChatMessage(`Claro. Puedes preguntarme sobre ${QUICK_TOPICS.join(", ")} o la agenda.`, "bot");
    return;
  }
  if (intent === "appointment") {
    appendChatMessage("Quiero revisar una cita", "user");
    resetChatFlow();
    chatFlow.step = "lookupCedula";
    setChatInput("Número de cédula", "numeric");
    appendChatMessage("Escribe tu cédula. Después verificaré el correo o teléfono registrado antes de mostrar tus citas.", "bot");
    return;
  }
  appendChatMessage("Quiero agendar una cita", "user");
  startChatBooking();
}

async function submitAppointmentChat(event) {
  event.preventDefault();
  const input = $("#appointment-chat-query");
  if (!input || chatFlow.busy) return;
  const rawValue = input.value.trim();
  if (!rawValue) return;
  const privateStep = ["lookupCedula", "bookingCedula", "bookingPhone"].includes(chatFlow.step) || (chatFlow.step === "lookupContact" && /^\+?[\d -]+$/.test(rawValue));
  appendChatMessage(privateStep ? maskForChat(rawValue) : rawValue, "user");
  input.value = "";
  await processChatMessage(rawValue);
}

async function processChatMessage(value) {
  const message = normalizeChatText(value);
  if (/^(cancelar|empezar de nuevo|reiniciar)$/.test(message)) {
    resetChatFlow();
    appendChatMessage("Listo, empezamos de nuevo. ¿Quieres agendar, revisar una cita o hacer una pregunta?", "bot");
    return;
  }
  if (/^(hola|buenos dias|buenas tardes|buenas noches|hey)$/.test(message)) {
    appendChatMessage("Hola. Puedo ayudarte a agendar, revisar una cita o responder dudas sobre los servicios del doctor.", "bot");
    return;
  }
  if (/^(gracias|muchas gracias)$/.test(message)) {
    appendChatMessage("Con gusto. ¿Te ayudo con algo más?", "bot");
    return;
  }
  if (/(tengo|revisar|consultar|proxima|agendada|ya tengo).{0,30}cita|cita.{0,20}(proxima|agendada)/.test(message)) {
    const includedCedula = value.match(/\b[\d -]{7,25}\b/)?.[0];
    if (includedCedula && normalizeCedulaInput(includedCedula).length >= 7) {
      resetChatFlow();
      chatFlow.lookupCedula = normalizeCedulaInput(includedCedula);
      chatFlow.step = "lookupContact";
      setChatInput("Correo o teléfono registrado", "text");
      appendChatMessage("Para proteger tus citas, escribe el correo o teléfono registrado en Huli.", "bot");
    } else {
      handleChatIntentWithoutEcho();
    }
    return;
  }
  if (/(agendar|reservar|disponibilidad|horarios|sacar una cita|nueva cita)/.test(message)) {
    await startChatBooking();
    return;
  }
  if (chatFlow.step !== "idle" && /[¿?]/.test(value) && /(incontilase|labioplast|hormona|menopausia|displasia|infografia|vph)/.test(message)) {
    await requestChat({ action: "info", message: value }, "Preparando la respuesta...");
    appendChatMessage("Podemos seguir con la cita cuando estés lista.", "bot");
    return;
  }
  if (chatFlow.step === "lookupCedula") {
    const cedula = normalizeCedulaInput(value);
    if (hasLetters(value) || cedula.length < 7 || cedula.length > 20) {
      appendChatMessage("La cédula debe tener al menos siete números. Revísala e intenta otra vez.", "bot", false, true);
      return;
    }
    chatFlow.lookupCedula = cedula;
    chatFlow.step = "lookupContact";
    setChatInput("Correo o teléfono registrado", "text");
    appendChatMessage("Para proteger tus citas, escribe el correo o teléfono registrado en Huli.", "bot");
    return;
  }
  if (chatFlow.step === "lookupContact") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && normalizeCedulaInput(value).length < 8) {
      appendChatMessage("Ingresa el correo o el teléfono completo registrado en Huli.", "bot", false, true);
      return;
    }
    const cedula = chatFlow.lookupCedula;
    resetChatFlow();
    await requestChat({ action: "lookup", cedula, contact: value }, "Buscando tus próximas citas...");
    return;
  }
  if (chatFlow.step === "selectSlot") {
    if (/^(mas horarios|ver mas|siguiente semana)$/.test(message)) return loadChatAvailability(chatFlow.offsetDays + 7);
    if (message === "mas de esta semana") return showMoreChatSlots();
    const selected = Number(message) - 1;
    if (Number.isInteger(selected) && chatFlow.slots[selected]) return chooseChatSlot(selected);
    appendChatMessage("Elige uno de los horarios que aparecen arriba o escribe su número. También puedes pedir más horarios.", "bot");
    return;
  }
  if (chatFlow.step === "bookingName") {
    const name = value.replace(/\s+/g, " ").trim();
    if (name.split(" ").length < 2 || name.length > 120) return appendChatMessage("Necesito tu nombre y apellido para la reserva.", "bot", false, true);
    chatFlow.patient.name = name;
    chatFlow.step = "bookingCedula";
    setChatInput("Número de cédula", "numeric");
    appendChatMessage("Gracias. ¿Cuál es tu número de cédula?", "bot");
    return;
  }
  if (chatFlow.step === "bookingCedula") {
    const cedula = normalizeCedulaInput(value);
    if (hasLetters(value) || cedula.length < 7 || cedula.length > 20) return appendChatMessage("Revisa la cédula; necesito entre 7 y 20 números.", "bot", false, true);
    chatFlow.patient.cedula = cedula;
    chatFlow.step = "bookingPhone";
    setChatInput("Teléfono", "tel");
    appendChatMessage("¿A qué teléfono podemos contactarte?", "bot");
    return;
  }
  if (chatFlow.step === "bookingPhone") {
    const phone = normalizeCedulaInput(value);
    if (phone.length < 8 || phone.length > 15) return appendChatMessage("Ingresa un teléfono válido, de 8 a 15 números.", "bot", false, true);
    chatFlow.patient.phone = phone;
    chatFlow.step = "bookingEmail";
    setChatInput("Correo electrónico", "email");
    appendChatMessage("Por último, ¿cuál es tu correo electrónico?", "bot");
    return;
  }
  if (chatFlow.step === "bookingEmail") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return appendChatMessage("Ese correo no parece válido. Revísalo e intenta otra vez.", "bot", false, true);
    chatFlow.patient.email = value;
    chatFlow.step = "confirmBooking";
    setChatInput("Confirma tu reserva", "text");
    appendChatMessage(`Revisa la reserva: ${chatFlow.slot.label}. Paciente: ${chatFlow.patient.name}. Correo: ${value}. ¿Confirmas que deseas crear la cita en Huli?`, "bot");
    appendChatChoices([{ label: "Confirmar reserva", value: "confirmar" }, { label: "Cancelar", value: "cancelar" }]);
    return;
  }
  if (chatFlow.step === "confirmBooking") {
    if (!/^(si|sí|confirmar|confirmo|acepto)$/.test(message)) return appendChatMessage("Escribe “confirmar” para crear la cita o “cancelar” para empezar de nuevo.", "bot");
    const payload = await requestChat({ action: "book", slot: chatFlow.slot, patient: chatFlow.patient }, "Confirmando el espacio con Huli...");
    if (payload?.booked) resetChatFlow();
    return;
  }
  await requestChat({ action: "info", message: value }, "Preparando la respuesta...");
}

function handleChatIntentWithoutEcho() {
  resetChatFlow();
  chatFlow.step = "lookupCedula";
  setChatInput("Número de cédula", "numeric");
  appendChatMessage("Claro. Escribe tu cédula. Después verificaré el correo o teléfono registrado.", "bot");
}

async function startChatBooking() {
  resetChatFlow();
  chatFlow.step = "selectSlot";
  appendChatMessage("Voy a consultar espacios libres del Dr. Carazo en sus dos sedes.", "bot");
  await loadChatAvailability(0);
}

async function loadChatAvailability(offsetDays) {
  if (offsetDays > 21) return appendChatMessage("Por ahora puedo revisar cuatro semanas. Para otras fechas abre el calendario de Huli.", "bot");
  chatFlow.offsetDays = offsetDays;
  chatFlow.slots = [];
  const payload = await requestChat({ action: "availability", offsetDays }, "Consultando disponibilidad...");
  if (!payload) return;
  chatFlow.slots = payload.slots || [];
  chatFlow.visibleSlots = 0;
  if (chatFlow.slots.length) {
    showMoreChatSlots();
  }
  if (payload.nextOffsetDays !== null) appendChatChoices([{ label: "Ver más horarios", value: "más horarios" }], false, false);
}

function showMoreChatSlots() {
  const start = chatFlow.visibleSlots;
  const end = Math.min(start + 6, chatFlow.slots.length);
  appendChatChoices(chatFlow.slots.slice(start, end).map((slot, index) => ({ label: `${start + index + 1}. ${slot.label}`, value: String(start + index + 1) })), true);
  chatFlow.visibleSlots = end;
  if (end < chatFlow.slots.length) appendChatChoices([{ label: "Más de esta semana", value: "más de esta semana" }], false, false);
}

function chooseChatSlot(index) {
  chatFlow.slot = chatFlow.slots[index];
  chatFlow.step = "bookingName";
  setChatInput("Nombre y apellido", "text");
  appendChatMessage(`Elegiste ${chatFlow.slot.label}. ¿Cuál es tu nombre y apellido?`, "bot");
}

function appendChatChoices(choices, slotList = false, scroll = true) {
  const list = $("#appointment-chat-messages");
  if (!list) return;
  const container = document.createElement("div");
  container.className = slotList ? "chat-slot-list" : "chat-choice-list";
  const stepAtCreation = chatFlow.step;
  const slotsAtCreation = chatFlow.slots;
  for (const choice of choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = choice.label;
    button.addEventListener("click", async () => {
      if (chatFlow.busy || chatFlow.step !== stepAtCreation || (slotList && chatFlow.slots !== slotsAtCreation)) return;
      button.disabled = true;
      appendChatMessage(choice.label, "user");
      await processChatMessage(choice.value);
    });
    container.appendChild(button);
  }
  list.appendChild(container);
  if (scroll) list.scrollTop = slotList ? container.offsetTop - list.offsetTop : list.scrollHeight;
}

async function requestChat(body, pendingText) {
  const pending = appendChatMessage(pendingText, "bot", true);
  const submitButton = $("#appointment-chat-form button[type='submit']");
  chatFlow.busy = true;
  if (submitButton) submitButton.disabled = true;
  try {
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    pending.remove();
    appendChatMessage(payload.reply || "No pude completar la consulta en este momento.", "bot", false, !response.ok);
    return response.ok ? payload : null;
  } catch (error) {
    pending.remove();
    appendChatMessage("No pude conectar con el asistente en este momento. Intenta de nuevo en unos segundos.", "bot", false, true);
    return null;
  } finally {
    chatFlow.busy = false;
    if (submitButton) submitButton.disabled = false;
  }
}

function resetChatFlow() {
  chatFlow.step = "idle";
  chatFlow.slot = null;
  chatFlow.slots = [];
  chatFlow.visibleSlots = 0;
  chatFlow.patient = {};
  chatFlow.lookupCedula = "";
  chatFlow.offsetDays = 0;
  setChatInput("Tu mensaje", "text");
}

function setChatInput(placeholder, inputMode) {
  const input = $("#appointment-chat-query");
  if (!input) return;
  input.placeholder = placeholder;
  input.inputMode = inputMode;
  input.focus();
}

function normalizeChatText(value) {
  return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function appendChatMessage(message, type = "bot", pending = false, isError = false) {
  const list = $("#appointment-chat-messages");
  if (!list) return document.createElement("div");
  const item = document.createElement("div");
  item.className = `chat-message ${type}`;
  if (pending) item.classList.add("is-pending");
  if (isError) item.classList.add("is-error");
  item.textContent = message;
  list.appendChild(item);
  list.scrollTop = list.scrollHeight;
  return item;
}

function normalizeCedulaInput(value) {
  return String(value || "").replace(/\D/g, "");
}

function hasLetters(value) {
  return /[A-Za-zÀ-ÿ]/.test(String(value || ""));
}

function maskForChat(value) {
  const digits = normalizeCedulaInput(value);
  if (digits.length <= 4) return digits;
  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
}

function openVideoModal(videoId, title = "Video informativo") {
  const modal = $("#video-modal");
  const frame = $("#video-frame");
  const heading = $("#video-modal-title");
  if (!modal || !frame) return;
  if (heading) heading.textContent = title;
  frame.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
  modal.hidden = false;
}

function closeVideoModal() {
  const modal = $("#video-modal");
  const frame = $("#video-frame");
  if (!modal || !frame) return;
  frame.src = "";
  modal.hidden = true;
}
