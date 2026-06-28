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

  /* -----------------------------------------------------
   * 6. Catálogo: filtros en vivo (solo corre si la grilla existe)
   *    Combina checkboxes (categoría / disponibilidad / color)
   *    con el buscador de texto. Todo client-side: no hay
   *    backend en este TP, pero el filtrado es funcional real,
   *    no decorativo.
   * --------------------------------------------------- */
  const grilla = document.getElementById("ts-grilla-productos");

  if (grilla) {
    const tarjetas = Array.from(grilla.querySelectorAll("[data-categoria]"));
    const buscador = document.getElementById("ts-buscador");
    const contador = document.getElementById("ts-contador");
    const sinResultados = document.getElementById("ts-sin-resultados");
    const limpiarBtn = document.getElementById("ts-limpiar-filtros");

    const checkedValues = (grupo) =>
      Array.from(document.querySelectorAll(`input[data-filter="${grupo}"]:checked`)).map((el) => el.value);

    const aplicarFiltros = () => {
      const categorias = checkedValues("categoria");
      const disponibilidades = checkedValues("disponibilidad");
      const colores = checkedValues("color");
      const texto = (buscador?.value || "").trim().toLowerCase();

      let visibles = 0;

      tarjetas.forEach((tarjeta) => {
        const cat = tarjeta.dataset.categoria;
        const disp = tarjeta.dataset.disponibilidad.split(" ");
        const color = tarjeta.dataset.color;
        const titulo = tarjeta.textContent.toLowerCase();

        // Selección vacía en un grupo = ese filtro no restringe (se muestran todas)
        const pasaCategoria = categorias.length === 0 || categorias.includes(cat);
        const pasaDisponibilidad = disponibilidades.length === 0 || disp.some((d) => disponibilidades.includes(d));
        const pasaColor = colores.length === 0 || colores.includes(color);
        const pasaTexto = texto === "" || titulo.includes(texto);

        const visible = pasaCategoria && pasaDisponibilidad && pasaColor && pasaTexto;
        tarjeta.classList.toggle("d-none", !visible);
        if (visible) visibles += 1;
      });

      if (contador) contador.textContent = visibles;
      if (sinResultados) sinResultados.classList.toggle("d-none", visibles !== 0);
    };

    document.querySelectorAll('#ts-filtros input[data-filter]').forEach((input) => {
      input.addEventListener("change", aplicarFiltros);
    });

    if (buscador) {
      buscador.addEventListener("input", aplicarFiltros);
    }

    if (limpiarBtn) {
      limpiarBtn.addEventListener("click", () => {
        document.querySelectorAll('#ts-filtros input[data-filter="categoria"]').forEach((el) => (el.checked = true));
        document.querySelectorAll('#ts-filtros input[data-filter="disponibilidad"]').forEach((el) => (el.checked = true));
        document.querySelectorAll('#ts-filtros input[data-filter="color"]').forEach((el) => (el.checked = false));
        if (buscador) buscador.value = "";
        aplicarFiltros();
      });
    }

    aplicarFiltros();
  }

  /* -----------------------------------------------------
   * 7. Página de producto: miniaturas sincronizadas con el
   *    carrusel (captura el evento propio de Bootstrap
   *    "slid.bs.carousel") + botón "Añadir al carrito".
   * --------------------------------------------------- */
  const galeria = document.getElementById("tsGaleriaProducto");
  const thumbs = document.querySelectorAll("[data-ts-thumb]");

  if (galeria && thumbs.length) {
    const marcarActiva = (index) => {
      thumbs.forEach((thumb, i) => thumb.classList.toggle("is-active", i === index));
    };
    galeria.addEventListener("slid.bs.carousel", (event) => marcarActiva(event.to));
    marcarActiva(0);
  }

  const addCarritoBtn = document.getElementById("ts-add-carrito");
  const talleSelect = document.getElementById("ts-talle");
  const talleToastSpan = document.getElementById("ts-talle-toast");

  if (addCarritoBtn) {
    addCarritoBtn.addEventListener("click", () => {
      if (talleToastSpan && talleSelect) talleToastSpan.textContent = talleSelect.value;
      const toastEl = document.getElementById("carritoToast");
      if (toastEl) bootstrap.Toast.getOrCreateInstance(toastEl).show();
    });
  }

  // =========================================================
  // LÓGICA DE PRODUCTO: Selector dinámico de precio
  // =========================================================

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleccionamos los inputs (los botones de alquilar/comprar) y los textos del precio
    const modalidadRadios = document.querySelectorAll('.ts-modalidad-radio');
    const precioDisplay = document.getElementById('ts-precio-display');
    const precioLabel = document.getElementById('ts-precio-label');

    // 2. Verificamos que estos elementos existan en la página actual para que no tire error en el index o catálogo
    if (modalidadRadios.length > 0 && precioDisplay && precioLabel) {

      // 3. Le agregamos un "escuchador" de eventos a cada botón
      modalidadRadios.forEach(radio => {
        radio.addEventListener('change', (evento) => {

          // 4. Capturamos el valor (38000 o 120000) y le damos formato de moneda argentina
          const precio = parseInt(evento.target.value).toLocaleString('es-AR');

          // 5. Actualizamos el número gigante en el HTML
          precioDisplay.textContent = `$${precio}`;

          // 6. Cambiamos el texto chiquito de arriba según qué botón se tocó
          if (evento.target.id === 'modAlquiler') {
            precioLabel.textContent = 'Precio por evento (incluye tintorería)';
          } else {
            precioLabel.textContent = 'Precio de compra final';
          }
        });
      });
    }
  });

})();
