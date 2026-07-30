"use strict";

/* =========================================================
   CONFIGURACIÓN PRINCIPAL
   ========================================================= */
const CONFIG = {
  whatsappNumber: "525631064309",

  testMode: false,
  testWhatsappNumber: "525536737159",

  eventDate: new Date("2026-09-26T14:00:00-06:00"),

  apiEndpoint:
    "https://script.google.com/macros/s/AKfycbxEBGgYQFfmboWXpfp9Xiro_zJE2h44g_apJc9OxgghEfxb8lwaYef7NFNX7hBDOz82/exec",

  // Página propia del control de acceso. Se publica junto a index.html.
  scannerPage: "scanner.html"
};

const $ = (selector, context = document) =>
  context.querySelector(selector);

const $$ = (selector, context = document) =>
  [...context.querySelectorAll(selector)];

const reducedMotion =
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

let selectedGender = "";
let currentSlide = 0;
let carouselTimer = null;
let personalizedGuest = null;
let invitationCode = "";

document.body.classList.add("invitation-locked");

/* =========================================================
   EFECTOS DEL CIELO
   ========================================================= */
function createSkyEffects() {
  const container = $("#sparkles");

  if (!container || reducedMotion) return;

  for (let i = 0; i < 46; i += 1) {
    const sparkle = document.createElement("span");
    const isStoryStar = i < 13;

    sparkle.className =
      `sparkle${isStoryStar ? " story-star" : ""}`;

    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.top = `${Math.random() * 100}%`;

    sparkle.style.setProperty(
      "--duration",
      `${3.8 + Math.random() * 5.5}s`
    );

    sparkle.style.setProperty(
      "--delay",
      `${-Math.random() * 8}s`
    );

    if (isStoryStar) {
      sparkle.style.setProperty(
        "--star-size",
        `${5 + Math.random() * 6}px`
      );
    }

    container.appendChild(sparkle);
  }

  const meteorLayer = $("#shootingStars");

  if (!meteorLayer) return;

  const launchShootingStar = () => {
    const star = document.createElement("span");
    const startsFromLeft = Math.random() > 0.22;

    const startX =
      startsFromLeft
        ? -18
        : 18 + Math.random() * 45;

    const startY =
      5 + Math.random() * 52;

    const travelX =
      startsFromLeft
        ? 82 + Math.random() * 35
        : 55 + Math.random() * 34;

    const travelY =
      28 + Math.random() * 28;

    star.className = "shooting-star";

    star.style.setProperty(
      "--start-x",
      `${startX}vw`
    );

    star.style.setProperty(
      "--start-y",
      `${startY}vh`
    );

    star.style.setProperty(
      "--travel-x",
      `${travelX}vw`
    );

    star.style.setProperty(
      "--travel-y",
      `${travelY}vh`
    );

    star.style.setProperty(
      "--angle",
      `${24 + Math.random() * 8}deg`
    );

    star.style.setProperty(
      "--tail",
      `${110 + Math.random() * 90}px`
    );

    star.style.setProperty(
      "--travel-time",
      `${1.9 + Math.random() * 1.1}s`
    );

    meteorLayer.appendChild(star);

    star.addEventListener(
      "animationend",
      () => star.remove(),
      { once: true }
    );

    window.setTimeout(
      launchShootingStar,
      4200 + Math.random() * 5200
    );
  };

  window.setTimeout(
    launchShootingStar,
    1500
  );
}

/* =========================================================
   PORTADA Y MÚSICA
   ========================================================= */
function setupIntroAndMusic() {
  const intro = $("#introScreen");
  const openButton = $("#openInvitationBtn");
  const music = $("#bgMusic");
  const audioButton = $("#audioBtn");
  const icon = $("#audioIcon");
  const label = $("#audioLabel");

  const refreshAudioButton = () => {
    const playing =
      music && !music.paused;

    audioButton?.classList.toggle(
      "is-playing",
      playing
    );

    audioButton?.setAttribute(
      "aria-pressed",
      String(playing)
    );

    if (icon) {
      icon.textContent =
        playing ? "❚❚" : "♪";
    }

    if (label) {
      label.textContent =
        playing ? "Pausar" : "Música";
    }
  };

  const tryPlay = async () => {
    if (!music) return;

    try {
      await music.play();
    } catch {
      // Algunos navegadores necesitan otra interacción.
    }

    refreshAudioButton();
  };

  openButton?.addEventListener(
    "click",
    async () => {
      intro?.classList.add("is-open");

      document.body.classList.remove(
        "invitation-locked"
      );

      await tryPlay();

      window.setTimeout(
        () => intro?.remove(),
        900
      );
    }
  );

  audioButton?.addEventListener(
    "click",
    async () => {
      if (!music) return;

      if (music.paused) {
        await tryPlay();
      } else {
        music.pause();
      }

      refreshAudioButton();
    }
  );

  music?.addEventListener(
    "play",
    refreshAudioButton
  );

  music?.addEventListener(
    "pause",
    refreshAudioButton
  );

  music?.addEventListener(
    "error",
    () => {
      audioButton?.classList.add(
        "is-missing"
      );

      audioButton?.setAttribute(
        "aria-label",
        "Agrega el archivo assets/audio/baby-paulo.mp3"
      );

      if (label) {
        label.textContent = "Sin audio";
      }
    }
  );
}

/* =========================================================
   CUENTA REGRESIVA
   ========================================================= */
function setupCountdown() {
  const fields = {
    days: $("#days"),
    hours: $("#hours"),
    minutes: $("#minutes"),
    seconds: $("#seconds")
  };

  const update = () => {
    const difference =
      CONFIG.eventDate.getTime() -
      Date.now();

    if (difference <= 0) {
      Object.values(fields).forEach(
        (field) => {
          if (field) {
            field.textContent = "00";
          }
        }
      );

      $("#eventPassed")
        ?.removeAttribute("hidden");

      return;
    }

    const day = 86_400_000;
    const hour = 3_600_000;
    const minute = 60_000;

    fields.days.textContent =
      String(
        Math.floor(difference / day)
      ).padStart(2, "0");

    fields.hours.textContent =
      String(
        Math.floor(
          (difference % day) / hour
        )
      ).padStart(2, "0");

    fields.minutes.textContent =
      String(
        Math.floor(
          (difference % hour) / minute
        )
      ).padStart(2, "0");

    fields.seconds.textContent =
      String(
        Math.floor(
          (difference % minute) / 1000
        )
      ).padStart(2, "0");
  };

  update();

  window.setInterval(
    update,
    1000
  );
}

/* =========================================================
   CARRUSEL
   ========================================================= */
function setupCarousel() {
  const slides = $$(".slide");
  const dots = $("#carouselDots");
  const carousel = $("#carousel");

  if (!slides.length || !dots) return;

  const showSlide = (index) => {
    currentSlide =
      (index + slides.length) %
      slides.length;

    slides.forEach(
      (slide, slideIndex) => {
        slide.classList.toggle(
          "is-active",
          slideIndex === currentSlide
        );

        slide.setAttribute(
          "aria-hidden",
          String(
            slideIndex !== currentSlide
          )
        );
      }
    );

    $$(".carousel-dot", dots).forEach(
      (dot, dotIndex) => {
        dot.classList.toggle(
          "is-active",
          dotIndex === currentSlide
        );

        dot.setAttribute(
          "aria-current",
          dotIndex === currentSlide
            ? "true"
            : "false"
        );
      }
    );
  };

  slides.forEach((_, index) => {
    const dot =
      document.createElement("button");

    dot.className = "carousel-dot";
    dot.type = "button";

    dot.setAttribute(
      "aria-label",
      `Ver fotografía ${index + 1}`
    );

    dot.addEventListener(
      "click",
      () => showSlide(index)
    );

    dots.appendChild(dot);
  });

  const restartTimer = () => {
    if (
      reducedMotion ||
      slides.length < 2
    ) {
      return;
    }

    window.clearInterval(
      carouselTimer
    );

    carouselTimer =
      window.setInterval(
        () =>
          showSlide(
            currentSlide + 1
          ),
        5200
      );
  };

  $("#prevSlide")
    ?.addEventListener(
      "click",
      () => {
        showSlide(
          currentSlide - 1
        );

        restartTimer();
      }
    );

  $("#nextSlide")
    ?.addEventListener(
      "click",
      () => {
        showSlide(
          currentSlide + 1
        );

        restartTimer();
      }
    );

  carousel?.addEventListener(
    "mouseenter",
    () =>
      window.clearInterval(
        carouselTimer
      )
  );

  carousel?.addEventListener(
    "mouseleave",
    restartTimer
  );

  carousel?.addEventListener(
    "focusin",
    () =>
      window.clearInterval(
        carouselTimer
      )
  );

  carousel?.addEventListener(
    "focusout",
    restartTimer
  );

  showSlide(0);
  restartTimer();
}

/* =========================================================
   DINÁMICA DE PREDICCIÓN
   ========================================================= */
function setupGenderGame() {
  $$(".gender-card").forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          selectedGender =
            button.dataset.gender || "";

          $$(".gender-card").forEach(
            (option) => {
              option.classList.toggle(
                "is-selected",
                option === button
              );

              option.setAttribute(
                "aria-pressed",
                String(
                  option === button
                )
              );
            }
          );

          const result =
            $("#genderSelection");

          if (result) {
            result.textContent =
              `Tu elección: Baby Paulo se parecerá más ${selectedGender}.`;
          }
        }
      );
    }
  );
}

/* =========================================================
   ANIMACIONES AL DESPLAZARSE
   ========================================================= */
function setupRevealAnimations() {
  const items = $$(".reveal");

  if (
    reducedMotion ||
    !("IntersectionObserver" in window)
  ) {
    items.forEach(
      (item) =>
        item.classList.add(
          "is-visible"
        )
    );

    return;
  }

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (
              entry.isIntersecting
            ) {
              entry.target.classList.add(
                "is-visible"
              );

              observer.unobserve(
                entry.target
              );
            }
          }
        );
      },
      {
        threshold: 0.12
      }
    );

  items.forEach(
    (item) =>
      observer.observe(item)
  );
}

/* =========================================================
   GUARDAR CONFIRMACIÓN EN GOOGLE SHEETS
   ========================================================= */
async function saveToSheet(payload) {
  if (
    !CONFIG.apiEndpoint ||
    CONFIG.apiEndpoint.includes(
      "PEGA_AQUI"
    )
  ) {
    return false;
  }

  try {
    await fetch(
      CONFIG.apiEndpoint,
      {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },
        body: JSON.stringify(
          payload
        )
      }
    );

    return true;
  } catch (error) {
    console.warn(
      "No fue posible registrar la confirmación.",
      error
    );

    return false;
  }
}

/* =========================================================
   CÓDIGO DE INVITACIÓN
   ========================================================= */
function normalizeInvitationCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9-]/g,
      ""
    )
    .slice(0, 24);
}

function getInvitationCodeFromUrl() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  return normalizeInvitationCode(
    params.get("codigo") ||
    params.get("code")
  );
}

/* =========================================================
   CONSULTAS JSONP A GOOGLE APPS SCRIPT
   ========================================================= */
function requestJsonp(params) {
  return new Promise(
    (resolve, reject) => {
      if (
        !CONFIG.apiEndpoint ||
        CONFIG.apiEndpoint.includes(
          "PEGA_AQUI"
        )
      ) {
        reject(
          new Error(
            "Falta configurar la URL de Google Apps Script."
          )
        );

        return;
      }

      const callbackName =
        `babyPauloCallback_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}`;

      const script =
        document.createElement(
          "script"
        );

      const timeout =
        window.setTimeout(
          () => {
            cleanup();

            reject(
              new Error(
                "La consulta tardó demasiado. Intenta nuevamente."
              )
            );
          },
          12000
        );

      const cleanup = () => {
        window.clearTimeout(
          timeout
        );

        delete window[
          callbackName
        ];

        script.remove();
      };

      window[callbackName] =
        (response) => {
          cleanup();
          resolve(response);
        };

      const url =
        new URL(
          CONFIG.apiEndpoint
        );

      Object.entries({
        ...params,
        callback: callbackName
      }).forEach(
        ([key, value]) => {
          url.searchParams.set(
            key,
            String(value)
          );
        }
      );

      script.src =
        url.toString();

      script.onerror = () => {
        cleanup();

        reject(
          new Error(
            "No fue posible conectar con la lista de invitados."
          )
        );
      };

      document.head.appendChild(
        script
      );
    }
  );
}

/* =========================================================
   URL DEL ESCÁNER
   ========================================================= */
function buildScannerUrl(code) {
  /*
    El QR abre scanner.html desde GitHub Pages.

    Esto evita que aparezca el mensaje de Google
    indicando que un usuario creó la aplicación.
  */
  const url =
    new URL(
      CONFIG.scannerPage,
      window.location.href
    );

  url.search = "";
  url.hash = "";

  url.searchParams.set(
    "codigo",
    code
  );

  return url.toString();
}

/* =========================================================
   GENERAR QR PERSONALIZADO
   ========================================================= */
function renderGuestQr(code) {
  const qrContainer =
    $("#guestQr");

  if (!qrContainer) return;

  qrContainer.innerHTML = "";

  if (
    typeof QRCode !== "function"
  ) {
    qrContainer.textContent =
      "No se pudo cargar el generador de QR.";

    return;
  }

  new QRCode(
    qrContainer,
    {
      text:
        buildScannerUrl(code),

      width: 230,
      height: 230,

      colorDark:
        "#263943",

      colorLight:
        "#ffffff",

      correctLevel:
        QRCode.CorrectLevel.H
    }
  );
}

/* =========================================================
   MOSTRAR INVITADO PERSONALIZADO
   ========================================================= */
function applyPersonalizedGuest(guest) {
  personalizedGuest = guest;

  const name =
    guest.invitado ||
    "Invitación personalizada";

  const introGuest =
    $("#introGuest");

  const guestNameInput =
    $("#guestName");

  const guestNameHelp =
    $("#guestNameHelp");

  if (introGuest) {
    introGuest.textContent =
      name;

    introGuest.hidden =
      false;
  }

  if (guestNameInput) {
    guestNameInput.value =
      name;

    guestNameInput.readOnly =
      true;
  }

  if (guestNameHelp) {
    guestNameHelp.textContent =
      "Nombre asociado al código único de esta invitación.";
  }

  $("#passGuestName").textContent =
    `Pase de ${name}`;

  $("#passInvitationName").textContent =
    name;

  $("#passCapacity").textContent =
    `${guest.cupoAsignado} persona${guest.cupoAsignado === 1 ? "" : "s"}`;

  $("#passConfirmation").textContent =
    guest.confirmacion ||
    "Pendiente";

  $("#passRemaining").textContent =
    String(
      guest.cupoRestante
    );

  $("#passCode").textContent =
    guest.codigo;

  $("#passSummary").hidden =
    false;

  $("#guestPassQrArea").hidden =
    false;

  $("#passLoading").hidden =
    true;

  renderGuestQr(
    guest.codigo
  );
}

/* =========================================================
   CARGAR INVITACIÓN PERSONALIZADA
   ========================================================= */
async function setupPersonalizedInvitation() {
  const section =
    $("#pasePersonalizado");

  if (!section) return;

  invitationCode =
    getInvitationCodeFromUrl();

  if (!invitationCode) return;

  section.hidden = false;

  try {
    const response =
      await requestJsonp({
        action: "guest",
        codigo: invitationCode
      });

    if (
      !response?.ok ||
      !response.guest
    ) {
      throw new Error(
        response?.message ||
        "El código de invitación no existe o ya no está activo."
      );
    }

    applyPersonalizedGuest(
      response.guest
    );
  } catch (error) {
    $("#passLoading").hidden =
      true;

    const errorBox =
      $("#passError");

    errorBox.textContent =
      error.message;

    errorBox.hidden =
      false;
  }
}

/* =========================================================
   FORMULARIO DE CONFIRMACIÓN
   ========================================================= */
function setupRsvp() {
  const form =
    $("#rsvpForm");

  const status =
    $("#rsvpStatus");

  const submitButton =
    $("#rsvpSubmitBtn");

  if (!form) return;

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      if (
        !form.reportValidity()
      ) {
        return;
      }

      const payload = {
        action: "rsvp",

        codigo:
          invitationCode,

        nombre:
          $("#guestName")
            .value
            .trim(),

        asistencia:
          $("#attendance")
            .value,

        prediccion:
          selectedGender ||
          "Sin elección",

        mensaje:
          $("#message")
            .value
            .trim(),

        evento:
          "Baby Shower Baby Paulo"
      };

      const text = [
        "Hola, confirmo mi respuesta para el Baby Shower de Baby Paulo.",

        "",

        `*Invitación:* ${personalizedGuest?.invitado || payload.nombre}`,

        invitationCode
          ? `*Código:* ${invitationCode}`
          : "",

        personalizedGuest
          ? `*Cupo asignado:* ${personalizedGuest.cupoAsignado}`
          : "",

        `*Asistencia:* ${payload.asistencia}`,

        `*¿A quién se parecerá más?:* ${payload.prediccion}`,

        payload.mensaje
          ? `*Mensaje:* ${payload.mensaje}`
          : ""
      ]
        .filter(Boolean)
        .join("\n");

      const encodedMessage =
        encodeURIComponent(text);

      const destinationNumber =
        CONFIG.testMode
          ? CONFIG.testWhatsappNumber
          : CONFIG.whatsappNumber;

      const isMobile =
        /Android|iPhone|iPad|iPod/i
          .test(
            navigator.userAgent
          );

      const whatsappUrl =
        isMobile
          ? `https://wa.me/${destinationNumber}?text=${encodedMessage}`
          : `https://web.whatsapp.com/send?phone=${destinationNumber}&text=${encodedMessage}`;

      const whatsappWindow =
        window.open(
          "about:blank",
          "_blank"
        );

      if (whatsappWindow) {
        whatsappWindow.opener =
          null;

        whatsappWindow.document.title =
          "Preparando WhatsApp…";

        whatsappWindow.document.body.innerHTML = `
          <p style="font-family:Arial,sans-serif;text-align:center;margin-top:60px;color:#52656f;">
            Guardando confirmación y preparando WhatsApp…
          </p>
        `;
      }

      submitButton.disabled =
        true;

      status.className =
        "rsvp-status";

      status.textContent =
        CONFIG.apiEndpoint &&
        !CONFIG.apiEndpoint.includes(
          "PEGA_AQUI"
        )
          ? "Guardando tu respuesta y preparando WhatsApp…"
          : "Preparando tu confirmación…";

      const saved =
        await saveToSheet(
          payload
        );

      status.textContent =
        saved
          ? "Respuesta enviada al registro. Se abrirá WhatsApp para terminar la confirmación."
          : "Se abrirá WhatsApp. Revisa la configuración de Google Apps Script para guardar el registro.";

      if (whatsappWindow) {
        whatsappWindow.location.href =
          whatsappUrl;
      } else {
        window.location.href =
          whatsappUrl;
      }

      submitButton.disabled =
        false;
    }
  );
}

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */
createSkyEffects();
setupIntroAndMusic();
setupCountdown();
setupCarousel();
setupGenderGame();
setupRevealAnimations();
setupPersonalizedInvitation();
setupRsvp();