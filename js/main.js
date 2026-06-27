/* =========================================================
 * THIS SUITS — main.js
 * -----------------------------------------------------------
 * Dos responsabilidades separadas a propósito:
 *  1) Inicializar los componentes JS de Bootstrap que lo
 *     requieren explícitamente (Toast, Tooltip) y escuchar
 *     los eventos propios de otros componentes (Offcanvas).
 *  2) Captura de eventos propia del sitio: scroll, formulario
 *     de contacto y selección de canal/tipo de consulta.
 * ========================================================= */
(() => {
  "use strict";

  /* -----------------------------------------------------
   * 1. Navbar: cambia de estado al hacer scroll
   * --------------------------------------------------- */
  const navbar = document.querySelector(".ts-navbar");
  const backToTopBtn = document.querySelector(".ts-back-to-top");
  const SCROLL_THRESHOLD = 40;

  const onScroll = () => {
    const scrolled = window.scrollY > SCROLL_THRESHOLD;
    if (navbar) navbar.classList.toggle("is-scrolled", scrolled);
    if (backToTopBtn) backToTopBtn.classList.toggle("is-visible", scrolled);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // estado inicial correcto si la página carga con scroll restaurado

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* -----------------------------------------------------
   * 2. Offcanvas (menú mobile): swap de ícono hamburguesa/cerrar
   *    Se capturan los eventos propios de Bootstrap para
   *    sincronizar un elemento que Bootstrap no controla.
   * --------------------------------------------------- */
  const mobileMenuToggle = document.querySelector("[data-ts-menu-toggle]");
  const mobileNav = document.getElementById("tsMobileNav");

  if (mobileNav && mobileMenuToggle) {
    mobileNav.addEventListener("shown.bs.offcanvas", () => {
      mobileMenuToggle.setAttribute("aria-expanded", "true");
      mobileMenuToggle.classList.add("is-open");
    });
    mobileNav.addEventListener("hidden.bs.offcanvas", () => {
      mobileMenuToggle.setAttribute("aria-expanded", "false");
      mobileMenuToggle.classList.remove("is-open");
    });
  }

  /* -----------------------------------------------------
   * 3. Tooltips de Bootstrap: requieren inicialización manual
   * --------------------------------------------------- */
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
    new bootstrap.Tooltip(el);
  });

  /* -----------------------------------------------------
   * 4. Formulario de contacto
   *    - Validación en vivo por campo (evento "input")
   *    - Envío simulado (evento "submit") con Toast de Bootstrap
   * --------------------------------------------------- */
  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    const fields = contactForm.querySelectorAll("input[required], textarea[required]");

    const validateField = (field) => {
      const valid = field.checkValidity();
      field.classList.toggle("is-valid-live", valid && field.value.trim() !== "");
      field.classList.toggle("is-invalid-live", !valid && field.value.trim() !== "");
      return valid;
    };

    fields.forEach((field) => {
      field.addEventListener("input", () => validateField(field));
      field.addEventListener("blur", () => validateField(field));
    });

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const allValid = Array.from(fields).every((field) => validateField(field));

      if (!allValid) {
        contactForm.classList.add("was-validated");
        const firstInvalid = contactForm.querySelector(".is-invalid-live");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // No hay backend en este TP: se simula el envío y se confirma con un Toast.
      const toastEl = document.getElementById("contactToast");
      if (toastEl) {
        const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
        toast.show();
      }

      contactForm.reset();
      fields.forEach((field) => field.classList.remove("is-valid-live", "is-invalid-live"));
      contactForm.classList.remove("was-validated");
    });

    contactForm.addEventListener("reset", () => {
      fields.forEach((field) => field.classList.remove("is-valid-live", "is-invalid-live"));
    });
  }

  /* -----------------------------------------------------
   * 5. Selector de canal y tipo de consulta
   *    Captura el evento "change" para reflejar la elección
   *    del usuario en un resumen visible, sin necesidad de
   *    recargar ni enviar nada al servidor.
   * --------------------------------------------------- */
  const channelInputs = document.querySelectorAll('input[name="ts-canal"]');
  const reasonInputs = document.querySelectorAll('input[name="ts-tipo-consulta"]');
  const summaryEl = document.querySelector("[data-ts-contact-summary]");

  const updateContactSummary = () => {
    if (!summaryEl) return;
    const channel = document.querySelector('input[name="ts-canal"]:checked');
    const reason = document.querySelector('input[name="ts-tipo-consulta"]:checked');
    const channelText = channel ? channel.value : "sin elegir";
    const reasonText = reason ? reason.value : "sin elegir";
    summaryEl.textContent = `Vas a contactarnos por ${channelText} sobre: ${reasonText}.`;
  };

  channelInputs.forEach((input) => input.addEventListener("change", updateContactSummary));
  reasonInputs.forEach((input) => input.addEventListener("change", updateContactSummary));
  updateContactSummary();
})();
