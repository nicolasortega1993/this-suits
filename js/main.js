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
   *    con el buscador de texto y el rango de precio. Todo client-side.
   * --------------------------------------------------- */
  const grilla = document.getElementById("ts-grilla-productos");

  if (grilla) {
    let tarjetas = Array.from(grilla.querySelectorAll("[data-categoria]"));
    const buscador = document.getElementById("ts-buscador");
    const contador = document.getElementById("ts-contador");
    const sinResultados = document.getElementById("ts-sin-resultados");
    const limpiarBtn = document.getElementById("ts-limpiar-filtros");
    const precioRango = document.getElementById("ts-precio-rango");
    const precioMaxVal = document.getElementById("ts-precio-max-val");

    // Configuración de paginación
    const PRODUCTS_PER_PAGE = 6;
    let currentPage = 1;
    let filteredTarjetas = [];

    const checkedValues = (grupo) =>
      Array.from(document.querySelectorAll(`input[data-filter="${grupo}"]:checked`)).map((el) => el.value);

    // Muestra solo los productos de la página actual
    const mostrarPagina = (page) => {
      currentPage = page;
      const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
      const endIdx = startIdx + PRODUCTS_PER_PAGE;

      // Ocultar todos
      tarjetas.forEach((tarjeta) => {
        tarjeta.classList.add("d-none");
      });

      // Mostrar solo los correspondientes a la página actual
      filteredTarjetas.slice(startIdx, endIdx).forEach((tarjeta) => {
        tarjeta.classList.remove("d-none");
      });

      renderizarPaginacion();
    };

    // Renderiza dinámicamente los números de página
    const renderizarPaginacion = () => {
      const paginacionUl = document.querySelector(".ts-pagination-custom");
      if (!paginacionUl) return;

      paginacionUl.innerHTML = "";

      const totalPages = Math.ceil(filteredTarjetas.length / PRODUCTS_PER_PAGE);
      if (totalPages <= 1) {
        paginacionUl.classList.add("d-none");
        return;
      }

      paginacionUl.classList.remove("d-none");

      for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement("li");
        li.className = `page-item ${i === currentPage ? "active" : ""}`;

        const span = document.createElement("span");
        span.className = "page-link";
        span.style.cursor = "pointer";
        span.textContent = i;
        span.addEventListener("click", () => {
          mostrarPagina(i);
          window.scrollTo({ top: 300, behavior: "smooth" });
        });

        li.appendChild(span);
        paginacionUl.appendChild(li);
      }
    };

    const aplicarFiltros = () => {
      const categorias = checkedValues("categoria");
      const disponibilidades = checkedValues("disponibilidad");
      const colores = checkedValues("color");
      const texto = (buscador?.value || "").trim().toLowerCase();
      const precioMaximo = precioRango ? parseFloat(precioRango.value) : Infinity;

      filteredTarjetas = [];

      tarjetas.forEach((tarjeta) => {
        const cat = tarjeta.dataset.categoria;
        const disp = tarjeta.dataset.disponibilidad.split(" ");
        const color = tarjeta.dataset.color;
        const precio = parseFloat(tarjeta.dataset.precio || 0);
        const titulo = tarjeta.textContent.toLowerCase();

        // Selección vacía en un grupo = ese filtro no restringe (se muestran todas)
        const pasaCategoria = categorias.length === 0 || categorias.includes(cat);
        const pasaDisponibilidad = disponibilidades.length === 0 || disp.some((d) => disponibilidades.includes(d));
        const pasaColor = colores.length === 0 || colores.includes(color);
        const pasaTexto = texto === "" || titulo.includes(texto);
        const pasaPrecio = precio === 0 || precio <= precioMaximo;

        const visible = pasaCategoria && pasaDisponibilidad && pasaColor && pasaTexto && pasaPrecio;
        if (visible) {
          filteredTarjetas.push(tarjeta);
        }
      });

      if (contador) contador.textContent = filteredTarjetas.length;
      if (sinResultados) sinResultados.classList.toggle("d-none", filteredTarjetas.length !== 0);

      // Resetear a la página 1 al aplicar cualquier filtro
      mostrarPagina(1);
    };

    document.querySelectorAll('#ts-filtros input[data-filter]').forEach((input) => {
      input.addEventListener("change", aplicarFiltros);
    });

    if (buscador) {
      buscador.addEventListener("input", aplicarFiltros);
    }

    if (precioRango) {
      precioRango.addEventListener("input", () => {
        if (precioMaxVal) {
          precioMaxVal.textContent = `$${parseFloat(precioRango.value).toLocaleString("es-AR")}`;
        }
        aplicarFiltros();
      });
    }

    if (limpiarBtn) {
      limpiarBtn.addEventListener("click", () => {
        document.querySelectorAll('#ts-filtros input[data-filter="categoria"]').forEach((el) => (el.checked = true));
        document.querySelectorAll('#ts-filtros input[data-filter="disponibilidad"]').forEach((el) => (el.checked = true));
        document.querySelectorAll('#ts-filtros input[data-filter="color"]').forEach((el) => (el.checked = false));
        if (buscador) buscador.value = "";
        if (precioRango) {
          precioRango.value = "900000";
          if (precioMaxVal) {
            precioMaxVal.textContent = "$900.000";
          }
        }
        aplicarFiltros();
      });
    }

    const ordenarProductos = () => {
      const criterio = document.getElementById("ts-orden")?.value;
      if (!criterio) return;

      const items = Array.from(grilla.querySelectorAll("article"));

      items.sort((a, b) => {
        const precioA = parseFloat(a.dataset.precio || 0);
        const precioB = parseFloat(b.dataset.precio || 0);
        const tituloA = a.querySelector(".ts-card-title-serif")?.textContent.toLowerCase() || "";
        const tituloB = b.querySelector(".ts-card-title-serif")?.textContent.toLowerCase() || "";

        if (criterio === "precio-asc") {
          return precioA - precioB;
        } else if (criterio === "precio-desc") {
          return precioB - precioA;
        } else {
          // 'novedades' o 'relevantes': ordenar alfabéticamente por título
          return tituloA.localeCompare(tituloB);
        }
      });

      // Reinsertar en el DOM con el nuevo orden
      items.forEach((item) => grilla.appendChild(item));

      // Releer las tarjetas para que la paginación las recorra en el orden correcto
      tarjetas = Array.from(grilla.querySelectorAll("[data-categoria]"));
      aplicarFiltros();
    };

    const ordenSelect = document.getElementById("ts-orden");
    if (ordenSelect) {
      ordenSelect.addEventListener("change", ordenarProductos);
      ordenarProductos(); // orden inicial
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
    const modAlquiler = document.getElementById("modAlquiler");
    
    // Al cargar la página, si "Alquilar" está seleccionado por defecto, adaptamos el texto del botón
    if (modAlquiler && modAlquiler.checked) {
      addCarritoBtn.textContent = "Solicitar Alquiler";
    }

    addCarritoBtn.addEventListener("click", () => {
      if (modAlquiler && modAlquiler.checked) {
        // Redirigir al formulario de alquiler con el producto y talle seleccionados
        const talle = talleSelect ? talleSelect.value : "";
        const producto = document.querySelector(".ts-product-title-serif")?.textContent.trim() || "Traje Royal Windsor";
        window.location.href = `alquiler.html?producto=${encodeURIComponent(producto)}&talle=${encodeURIComponent(talle)}`;
        return;
      }

      // Si es compra, agregar al carrito (flujo estándar)
      if (talleToastSpan && talleSelect) talleToastSpan.textContent = talleSelect.value;
      const toastEl = document.getElementById("carritoToast");
      if (toastEl) bootstrap.Toast.getOrCreateInstance(toastEl).show();
    });
  }

  // =========================================================
  // Selector dinámico de precios y botones para productos
  // =========================================================

  document.addEventListener('DOMContentLoaded', () => {
    const modalidadRadios = document.querySelectorAll('.ts-modalidad-radio');
    const precioDisplay = document.getElementById('ts-precio-display');
    const precioLabel = document.getElementById('ts-precio-label');
    const addCarritoBtn = document.getElementById("ts-add-carrito");

    if (modalidadRadios.length > 0 && precioDisplay && precioLabel) {
      modalidadRadios.forEach(radio => {
        radio.addEventListener('change', (evento) => {
          const precio = parseInt(evento.target.value).toLocaleString('es-AR');
          precioDisplay.textContent = `$${precio}`;

          if (evento.target.id === 'modAlquiler') {
            precioLabel.textContent = 'Precio por evento (incluye tintorería)';
            if (addCarritoBtn) addCarritoBtn.textContent = "Solicitar Alquiler";
          } else {
            precioLabel.textContent = 'Precio de compra final';
            if (addCarritoBtn) addCarritoBtn.textContent = "Añadir al carrito";
          }
        });
      });
    }
  });

  /* -----------------------------------------------------
   * 8. Página de Alquiler: prellenado desde URL,
   *    actualización interactiva de vista previa y
   *    validación / envío simulado del formulario.
   * --------------------------------------------------- */
  const rentalForm = document.getElementById("rentalForm");
  if (rentalForm) {
    const productSelect = document.getElementById("ts-rental-product");
    const talleSelectRental = document.getElementById("ts-rental-talle");
    
    // Elementos de la vista previa interactiva
    const previewImage = document.getElementById("ts-preview-image");
    const previewTitle = document.getElementById("ts-preview-title");
    const previewDesc = document.getElementById("ts-preview-desc");
    const previewPrice = document.getElementById("ts-preview-price");

    // Función para actualizar la vista previa de la prenda elegida
    const updatePreview = () => {
      if (!productSelect) return;
      const selectedOption = productSelect.options[productSelect.selectedIndex];
      if (!selectedOption) return;

      const productName = selectedOption.value;
      const productPrice = selectedOption.getAttribute("data-price");
      const productImage = selectedOption.getAttribute("data-image");
      const productDesc = selectedOption.getAttribute("data-desc");

      // Actualizar DOM de vista previa con animación de fade
      if (previewImage) {
        previewImage.style.opacity = "0";
        setTimeout(() => {
          previewImage.src = productImage || "img/placeholder-square.svg";
          previewImage.style.opacity = "1";
        }, 150);
      }

      if (previewTitle) previewTitle.textContent = productName;
      if (previewDesc) previewDesc.textContent = productDesc || "";
      if (previewPrice && productPrice) {
        previewPrice.textContent = `$${parseInt(productPrice).toLocaleString("es-AR")}`;
      }
    };

    // Prellenar desde query params de la URL (?producto=xxx&talle=yyy)
    const params = new URLSearchParams(window.location.search);
    const paramProducto = params.get("producto");
    const paramTalle = params.get("talle");

    if (paramProducto && productSelect) {
      for (let i = 0; i < productSelect.options.length; i++) {
        if (productSelect.options[i].value.toLowerCase() === paramProducto.toLowerCase()) {
          productSelect.selectedIndex = i;
          break;
        }
      }
    }

    if (paramTalle && talleSelectRental) {
      for (let i = 0; i < talleSelectRental.options.length; i++) {
        if (talleSelectRental.options[i].value === paramTalle) {
          talleSelectRental.selectedIndex = i;
          break;
        }
      }
    }

    // Inicializar vista previa al cargar
    updatePreview();

    // Escuchar cambios en el selector para actualizar la vista previa
    productSelect.addEventListener("change", updatePreview);

    // Validación en vivo de campos obligatorios
    const fields = rentalForm.querySelectorAll("input[required], select[required], textarea[required]");

    const validateField = (field) => {
      const valid = field.checkValidity();
      field.classList.toggle("is-valid", valid && field.value.trim() !== "");
      field.classList.toggle("is-invalid", !valid);
      return valid;
    };

    // Envío del formulario con simulación de éxito
    rentalForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const allValid = Array.from(fields).every((field) => validateField(field));

      if (!allValid) {
        rentalForm.classList.add("was-validated");
        const firstInvalid = rentalForm.querySelector(".is-invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Mostrar Toast de éxito de Bootstrap
      const toastEl = document.getElementById("rentalToast");
      if (toastEl) {
        const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
        toast.show();
      }

      // Resetear formulario
      rentalForm.reset();
      fields.forEach((field) => field.classList.remove("is-valid", "is-invalid"));
      rentalForm.classList.remove("was-validated");

      // Forzar actualización de vista previa al estado por defecto tras el reset
      setTimeout(updatePreview, 50);
    });

    // Evento reset
    rentalForm.addEventListener("reset", () => {
      fields.forEach((field) => field.classList.remove("is-valid", "is-invalid"));
      rentalForm.classList.remove("was-validated");
      setTimeout(updatePreview, 50);
    });
  }

})();
