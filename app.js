const HULI_SCHEDULE_URL = "https://widgets.hulilabs.com/es/doctor/calendars?wid=dc0&did=542";
const CHAT_API_URL = "/api/appointment-chat";

const QUICK_TOPICS = [
  "IncontiLase",
  "Labioplastia",
  "Hormonas bioidénticas",
  "Displasia de cérvix"
];

const NEEDS = {
  orina: {
    count: "01",
    title: "IncontiLase FOTONA",
    copy: "Información para mujeres con pérdidas de orina al toser, reír o hacer ejercicio.",
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
    copy: "Orientación sobre sequedad, incomodidad, salud vaginal y alternativas que requieren valoración individual.",
    image: "assets/incontilase-fotona-system.jpg",
    alt: "Equipo Fotona relacionado con procedimientos de salud íntima femenina",
    visualClass: "need-visual-intima",
    visualTitle: "Salud íntima",
    visualMeta: "Valoración individual",
    links: [
      { label: "Ver servicios", href: "ginecologia.html#procedimientos" },
      { label: "Agendar valoración", href: "https://widgets.hulilabs.com/es/doctor/calendars?wid=dc0&did=542" }
    ]
  },
  hormonas: {
    count: "03",
    title: "Menopausia y hormonas",
    copy: "Información general sobre terapia con hormonas bioidénticas y acompañamiento médico durante cambios hormonales.",
    image: "assets/dr-luis-diego-carazo-premium.png",
    alt: "Retrato del Dr. Luis Diego Carazo",
    visualClass: "need-visual-hormonas",
    visualTitle: "Hormonas",
    visualMeta: "Seguimiento médico",
    links: [
      { label: "Leer hormonas", href: "ginecologia.html#procedimientos" },
      { label: "Preguntar a Sofi", chat: true }
    ]
  },
  procedimientos: {
    count: "04",
    title: "Procedimientos ginecológicos",
    copy: "Labioplastia, displasia de cérvix, tratamientos láser y procedimientos que requieren indicación clínica.",
    image: "assets/incontilase-fotona-system.jpg",
    alt: "Equipo Fotona usado como referencia tecnológica para procedimientos ginecológicos",
    visualClass: "need-visual-procedimientos",
    visualTitle: "Plan clínico",
    visualMeta: "Procedimientos",
    links: [
      { label: "Ver procedimientos", href: "ginecologia.html#procedimientos" },
      { label: "Agendar", href: "https://widgets.hulilabs.com/es/doctor/calendars?wid=dc0&did=542" }
    ]
  },
  general: {
    count: "05",
    title: "Consulta general",
    copy: "Agenda una valoración si necesitas revisar síntomas, controles, ultrasonidos o dudas ginecológicas generales.",
    image: "assets/dr-luis-diego-carazo-premium.png",
    alt: "Retrato del Dr. Luis Diego Carazo",
    visualClass: "need-visual-general",
    visualTitle: "Consulta",
    visualMeta: "Agenda oficial",
    links: [
      { label: "Abrir Huli", href: "https://widgets.hulilabs.com/es/doctor/calendars?wid=dc0&did=542" },
      { label: "FAQ", href: "faq.html" }
    ]
  }
};

const $ = (selector) => document.querySelector(selector);

document.addEventListener("DOMContentLoaded", () => {
  renderAppointmentChatWidget();
  bindNavigation();
  bindFaq();
  bindVideos();
  bindNeedFinder();
  bindOpenChatButtons();
  bindHeaderScroll();
  initReveal();
});

function bindNavigation() {
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") || window.location.hash.replace("#", "");
  if (section) {
    window.requestAnimationFrame(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (params.get("section")) window.history.replaceState(null, "", window.location.pathname);
    });
  }

  $("#mobile-menu-toggle")?.addEventListener("click", () => {
    const nav = $("#main-nav");
    const button = $("#mobile-menu-toggle");
    if (!nav || !button) return;
    nav.toggleAttribute("data-open");
    button.setAttribute("aria-expanded", String(nav.hasAttribute("data-open")));
    document.body.classList.toggle("nav-open", nav.hasAttribute("data-open"));
  });
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
        <h3>Agenda e información médica</h3>
        <div class="chat-mode" role="tablist" aria-label="Modo de consulta">
          <button class="is-active" type="button" data-chat-mode="appointment">Cita</button>
          <button type="button" data-chat-mode="info">Información</button>
        </div>
        <div class="chat-messages" id="appointment-chat-messages" aria-live="polite">
          <div class="chat-message bot">Hola, soy Sofi. Puedo revisar si existe una cita por cédula o responder sobre servicios del sitio.</div>
        </div>
        <form class="chat-form" id="appointment-chat-form">
          <label>
            <span id="chat-input-label">Cédula</span>
            <input id="appointment-chat-query" type="text" inputmode="numeric" autocomplete="off" placeholder="Ej. 101110111" required>
          </label>
          <button class="button primary wide" type="submit">Enviar</button>
        </form>
        <div class="quick-topics" id="quick-topics" hidden></div>
        <div class="chat-actions">
          <a class="button secondary wide" href="${HULI_SCHEDULE_URL}" rel="noopener">Abrir agenda Huli</a>
        </div>
        <small>El asistente no diagnostica, no sustituye consulta médica y no muestra cédulas completas.</small>
      </div>
    </aside>
  `);

  $("#appointment-chat-toggle")?.addEventListener("click", toggleAppointmentChat);
  $("#appointment-chat-close")?.addEventListener("click", closeAppointmentChat);
  $("#appointment-chat-form")?.addEventListener("submit", submitAppointmentChat);
  document.querySelectorAll("[data-chat-mode]").forEach((button) => {
    button.addEventListener("click", () => setChatMode(button.dataset.chatMode));
  });
  renderQuickTopics();
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

function setChatMode(mode) {
  const input = $("#appointment-chat-query");
  const label = $("#chat-input-label");
  const topics = $("#quick-topics");
  document.querySelectorAll("[data-chat-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.chatMode === mode);
  });
  document.body.dataset.chatMode = mode;
  if (mode === "info") {
    if (label) label.textContent = "Pregunta";
    if (input) {
      input.inputMode = "text";
      input.placeholder = "Ej. ¿Qué es IncontiLase?";
      input.value = "";
      input.focus();
    }
    if (topics) topics.hidden = false;
    return;
  }

  if (label) label.textContent = "Cédula";
  if (input) {
    input.inputMode = "numeric";
    input.placeholder = "Ej. 101110111";
    input.value = "";
    input.focus();
  }
  if (topics) topics.hidden = true;
}

function renderQuickTopics() {
  const container = $("#quick-topics");
  if (!container) return;
  container.innerHTML = QUICK_TOPICS
    .map((topic) => `<button type="button" data-topic="${topic}">${topic}</button>`)
    .join("");
  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-topic]");
    if (!button) return;
    const input = $("#appointment-chat-query");
    if (input) input.value = button.dataset.topic;
    submitAppointmentChat(new Event("submit"));
  });
}

async function submitAppointmentChat(event) {
  event.preventDefault();
  const input = $("#appointment-chat-query");
  if (!input) return;

  const mode = document.body.dataset.chatMode === "info" ? "info" : "appointment";
  const rawValue = input.value.trim();

  if (!rawValue) {
    appendChatMessage(mode === "info" ? "Escribe una pregunta sobre los servicios." : "Necesito un número de cédula para revisar la cita.", "bot", false, true);
    return;
  }

  if (mode === "appointment" && hasLetters(rawValue)) {
    appendChatMessage("Ese dato no parece una cédula válida. Ingresa solo números; guiones y espacios se limpian automáticamente.", "bot", false, true);
    return;
  }

  const cleanValue = mode === "appointment" ? normalizeCedulaInput(rawValue) : rawValue;
  if (mode === "appointment" && !cleanValue) {
    appendChatMessage("Necesito un número de cédula para revisar la cita.", "bot", false, true);
    return;
  }

  appendChatMessage(mode === "appointment" ? maskForChat(cleanValue) : rawValue, "user");
  input.value = "";
  const pending = appendChatMessage(mode === "appointment" ? "Consultando Huli..." : "Revisando información aprobada...", "bot", true);
  const submitButton = $("#appointment-chat-form button[type='submit']");
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, query: cleanValue, message: rawValue, rawInput: rawValue })
    });
    const payload = await response.json().catch(() => ({}));
    pending.remove();
    appendChatMessage(payload.reply || "No pude completar la consulta en este momento.", "bot", false, !response.ok);
  } catch (error) {
    pending.remove();
    appendChatMessage("No pude conectar con el asistente en este momento. Intenta de nuevo en unos segundos.", "bot", false, true);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
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
