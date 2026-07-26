/**
 * Baby Paulo - Lista de invitados y control de acceso QR
 *
 * Este proyecto debe estar VINCULADO a la hoja de cálculo del evento.
 * No publiques la hoja. La aplicación web se ejecuta con tu cuenta y
 * solamente expone los datos necesarios para la invitación y el acceso.
 */

const APP = Object.freeze({
  GUESTS_SHEET: "Invitados",
  ACCESS_LOG_SHEET: "Accesos",
  CODE_PREFIX: "BP",
  CODE_LENGTH: 8,
  TIME_ZONE: "America/Mexico_City",
  GUEST_HEADERS: [
    "Código",
    "Invitado/Familia",
    "Teléfono",
    "Cupo asignado",
    "Confirmación",
    "Ingresaron",
    "Cupo restante",
    "Estado",
    "Hora de acceso",
    "Enlace invitación",
    "Enlace escáner",
    "Predicción",
    "Mensaje",
    "Última actualización"
  ],
  LOG_HEADERS: [
    "Fecha y hora",
    "Código",
    "Invitado/Familia",
    "Personas registradas",
    "Total ingresado",
    "Cupo restante",
    "Estado"
  ]
});

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Invitaciones QR")
    .addItem("1. Preparar hojas", "setupSystem")
    .addItem("2. Configurar URLs y PIN", "configureProject")
    .addSeparator()
    .addItem("Generar códigos y enlaces", "generateGuestPasses")
    .addItem("Actualizar cupos y estados", "refreshAllGuestRows")
    .addToUi();
}

/**
 * Crea las hojas y encabezados. Ejecuta esta función una sola vez.
 */
function setupSystem() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Abre este script desde la hoja de cálculo del evento.");

  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", spreadsheet.getId());

  const guests = getOrCreateSheet_(spreadsheet, APP.GUESTS_SHEET, APP.GUEST_HEADERS);
  const log = getOrCreateSheet_(spreadsheet, APP.ACCESS_LOG_SHEET, APP.LOG_HEADERS);

  guests.setFrozenRows(1);
  guests.getRange(1, 1, 1, APP.GUEST_HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#dceef8")
    .setFontColor("#3e4b53");

  guests.setColumnWidth(1, 130);
  guests.setColumnWidth(2, 230);
  guests.setColumnWidth(3, 135);
  guests.setColumnWidths(4, 6, 115);
  guests.setColumnWidth(7, 115);
  guests.setColumnWidth(8, 135);
  guests.setColumnWidth(9, 165);
  guests.setColumnWidths(10, 2, 280);
  guests.setColumnWidth(12, 150);
  guests.setColumnWidth(13, 260);
  guests.setColumnWidth(14, 175);

  const confirmationRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Pendiente", "Sí asistiré", "No podré asistir"], true)
    .setAllowInvalid(false)
    .build();
  guests.getRange(2, 5, Math.max(guests.getMaxRows() - 1, 1), 1).setDataValidation(confirmationRule);

  guests.getRange(2, 4, Math.max(guests.getMaxRows() - 1, 1), 1).setNumberFormat("0");
  guests.getRange(2, 6, Math.max(guests.getMaxRows() - 1, 1), 2).setNumberFormat("0");
  guests.getRange(2, 9, Math.max(guests.getMaxRows() - 1, 1), 1).setNumberFormat("dd/mm/yyyy hh:mm");
  guests.getRange(2, 14, Math.max(guests.getMaxRows() - 1, 1), 1).setNumberFormat("dd/mm/yyyy hh:mm");

  log.setFrozenRows(1);
  log.getRange(1, 1, 1, APP.LOG_HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#f9e5a6")
    .setFontColor("#3e4b53");
  log.autoResizeColumns(1, APP.LOG_HEADERS.length);
  log.getRange(2, 1, Math.max(log.getMaxRows() - 1, 1), 1).setNumberFormat("dd/mm/yyyy hh:mm:ss");

  SpreadsheetApp.getUi().alert(
    "Sistema preparado",
    "Ahora despliega la aplicación web y después usa “Configurar URLs y PIN”.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Guarda la URL pública de la invitación, la URL /exec de Apps Script y el PIN.
 * Los valores se almacenan en Script Properties, no dentro de la hoja.
 */
function configureProject() {
  const ui = SpreadsheetApp.getUi();
  const properties = PropertiesService.getScriptProperties();

  const invitationResult = ui.prompt(
    "URL de la invitación",
    "Pega la URL pública de la rama QR. Ejemplo: https://usuario.github.io/repositorio/",
    ui.ButtonSet.OK_CANCEL
  );
  if (invitationResult.getSelectedButton() !== ui.Button.OK) return;

  const webAppResult = ui.prompt(
    "URL de Google Apps Script",
    "Pega la URL de la implementación que termina en /exec.",
    ui.ButtonSet.OK_CANCEL
  );
  if (webAppResult.getSelectedButton() !== ui.Button.OK) return;

  const pinResult = ui.prompt(
    "PIN del personal de acceso",
    "Usa al menos 6 caracteres. No compartas este PIN con los invitados.",
    ui.ButtonSet.OK_CANCEL
  );
  if (pinResult.getSelectedButton() !== ui.Button.OK) return;

  const invitationBaseUrl = normalizeBaseUrl_(invitationResult.getResponseText());
  const webAppUrl = String(webAppResult.getResponseText() || "").trim();
  const staffPin = String(pinResult.getResponseText() || "").trim();

  if (!/^https:\/\//i.test(invitationBaseUrl)) {
    throw new Error("La URL de la invitación debe comenzar con https://");
  }
  if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/i.test(webAppUrl)) {
    throw new Error("La URL de Apps Script no parece válida. Debe terminar en /exec.");
  }
  if (staffPin.length < 6) {
    throw new Error("El PIN debe tener al menos 6 caracteres.");
  }

  properties.setProperties({
    INVITATION_BASE_URL: invitationBaseUrl,
    WEB_APP_URL: webAppUrl,
    STAFF_PIN: staffPin
  });

  ui.alert("Configuración guardada. Ya puedes generar códigos y enlaces.");
}

/**
 * Genera un código aleatorio por fila y crea los enlaces personalizados.
 * Antes de ejecutarla, llena al menos Invitado/Familia y Cupo asignado.
 */
function generateGuestPasses() {
  const sheet = getGuestsSheet_();
  const config = getRequiredConfig_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("Primero agrega invitados en la hoja Invitados.");
    return;
  }

  const range = sheet.getRange(2, 1, lastRow - 1, APP.GUEST_HEADERS.length);
  const values = range.getValues();
  const existingCodes = new Set(
    values.map(row => normalizeCode_(row[0])).filter(Boolean)
  );

  let generated = 0;
  values.forEach((row) => {
    const guestName = cleanText_(row[1], 160);
    const capacity = positiveInteger_(row[3]);
    if (!guestName || capacity < 1) return;

    let code = normalizeCode_(row[0]);
    if (!code) {
      code = createUniqueCode_(existingCodes);
      existingCodes.add(code);
      generated += 1;
    }

    const entered = clampInteger_(row[5], 0, capacity);
    const confirmation = cleanConfirmation_(row[4]);
    const remaining = Math.max(capacity - entered, 0);
    const status = calculateStatus_(confirmation, entered, remaining);

    row[0] = code;
    row[1] = guestName;
    row[3] = capacity;
    row[4] = confirmation;
    row[5] = entered;
    row[6] = remaining;
    row[7] = status;
    row[9] = buildInvitationUrl_(config.invitationBaseUrl, code);
    row[10] = buildScannerUrl_(config.webAppUrl, code);
    row[13] = new Date();
  });

  range.setValues(values);
  SpreadsheetApp.flush();

  SpreadsheetApp.getUi().alert(
    "Invitaciones actualizadas",
    `${generated} código(s) nuevo(s) generado(s). Los enlaces están en las columnas J y K.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function refreshAllGuestRows() {
  const sheet = getGuestsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  for (let row = 2; row <= lastRow; row += 1) {
    refreshGuestRow_(sheet, row);
  }
  SpreadsheetApp.flush();
}

function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== APP.GUESTS_SHEET || e.range.getRow() < 2) return;

  const editedColumn = e.range.getColumn();
  if ([2, 4, 5, 6].includes(editedColumn)) {
    refreshGuestRow_(sheet, e.range.getRow());
  }
}

/**
 * Punto de entrada público:
 * - ?action=guest&codigo=BP-XXXXXXXX&callback=... devuelve JSONP.
 * - ?view=scanner&codigo=BP-XXXXXXXX abre la pantalla móvil del acceso.
 */
function doGet(e) {
  const parameters = (e && e.parameter) || {};
  const view = String(parameters.view || "").toLowerCase();

  if (view === "scanner") {
    const template = HtmlService.createTemplateFromFile("Scanner");
    template.initialCode = normalizeCode_(parameters.codigo || parameters.code);
    return template
      .evaluate()
      .setTitle("Control de acceso | Baby Paulo")
      .addMetaTag("viewport", "width=device-width, initial-scale=1");
  }

  const action = String(parameters.action || "health").toLowerCase();
  let result;

  try {
    if (action === "guest") {
      result = { ok: true, guest: getPublicGuest_(parameters.codigo || parameters.code) };
    } else {
      result = { ok: true, service: "Baby Paulo QR", message: "Servicio disponible" };
    }
  } catch (error) {
    result = { ok: false, message: error.message || "No fue posible completar la consulta." };
  }

  return createPublicOutput_(result, parameters.callback);
}

/**
 * Recibe las confirmaciones enviadas desde GitHub Pages.
 */
function doPost(e) {
  let result;
  try {
    const payload = parseRequestBody_(e);
    const action = String(payload.action || "").toLowerCase();

    if (action !== "rsvp") throw new Error("Acción no permitida.");
    result = saveRsvp_(payload);
  } catch (error) {
    result = { ok: false, message: error.message || "No fue posible guardar la respuesta." };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * La pantalla Scanner.html llama estas funciones con google.script.run.
 */
function getGuestForScanner(code, staffPin) {
  verifyStaffPin_(staffPin);
  const guest = getGuestRecord_(code);
  return scannerGuestResponse_(guest);
}

function registerCheckIn(code, peopleCount, staffPin) {
  verifyStaffPin_(staffPin);

  const count = positiveInteger_(peopleCount);
  if (count < 1) throw new Error("Indica cuántas personas llegaron.");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const guest = getGuestRecord_(code);
    if (guest.cupoRestante <= 0) {
      throw new Error("Esta invitación ya utilizó todo su cupo.");
    }
    if (count > guest.cupoRestante) {
      throw new Error(`Solo quedan ${guest.cupoRestante} lugar(es) disponibles.`);
    }

    const sheet = guest.sheet;
    const newEntered = guest.ingresaron + count;
    const newRemaining = guest.cupoAsignado - newEntered;
    const newStatus = calculateStatus_(guest.confirmacion, newEntered, newRemaining);
    const now = new Date();

    sheet.getRange(guest.row, 6, 1, 4).setValues([[
      newEntered,
      newRemaining,
      newStatus,
      now
    ]]);
    sheet.getRange(guest.row, 14).setValue(now);

    const log = getAccessLogSheet_();
    log.appendRow([
      now,
      guest.codigo,
      guest.invitado,
      count,
      newEntered,
      newRemaining,
      newStatus
    ]);

    SpreadsheetApp.flush();

    return {
      ok: true,
      message: count === 1
        ? "Se registró el ingreso de 1 persona."
        : `Se registró el ingreso de ${count} personas.`,
      guest: {
        codigo: guest.codigo,
        invitado: guest.invitado,
        cupoAsignado: guest.cupoAsignado,
        ingresaron: newEntered,
        cupoRestante: newRemaining,
        confirmacion: guest.confirmacion,
        estado: newStatus,
        horaAcceso: formatDate_(now)
      }
    };
  } finally {
    lock.releaseLock();
  }
}

function saveRsvp_(payload) {
  const code = normalizeCode_(payload.codigo || payload.code);
  if (!code) throw new Error("La invitación no incluye un código válido.");

  const guest = getGuestRecord_(code);
  const confirmation = cleanConfirmation_(payload.asistencia);
  const prediction = cleanText_(payload.prediccion, 120);
  const message = cleanText_(payload.mensaje, 600);
  const status = calculateStatus_(confirmation, guest.ingresaron, guest.cupoRestante);
  const now = new Date();

  guest.sheet.getRange(guest.row, 5).setValue(confirmation);
  guest.sheet.getRange(guest.row, 8).setValue(status);
  guest.sheet.getRange(guest.row, 12).setValue(prediction);
  guest.sheet.getRange(guest.row, 13).setValue(message);
  guest.sheet.getRange(guest.row, 14).setValue(now);

  return { ok: true, message: "Confirmación guardada." };
}

function getPublicGuest_(code) {
  const guest = getGuestRecord_(code);
  return {
    codigo: guest.codigo,
    invitado: guest.invitado,
    cupoAsignado: guest.cupoAsignado,
    confirmacion: guest.confirmacion,
    ingresaron: guest.ingresaron,
    cupoRestante: guest.cupoRestante,
    estado: guest.estado
  };
}

function scannerGuestResponse_(guest) {
  return {
    ok: true,
    guest: {
      codigo: guest.codigo,
      invitado: guest.invitado,
      telefono: guest.telefono,
      cupoAsignado: guest.cupoAsignado,
      confirmacion: guest.confirmacion,
      ingresaron: guest.ingresaron,
      cupoRestante: guest.cupoRestante,
      estado: guest.estado,
      horaAcceso: guest.horaAcceso ? formatDate_(guest.horaAcceso) : "Sin acceso"
    }
  };
}

function getGuestRecord_(rawCode) {
  const code = normalizeCode_(rawCode);
  if (!code) throw new Error("Código de invitación inválido.");

  const sheet = getGuestsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error("La lista de invitados está vacía.");

  const match = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .createTextFinder(code)
    .matchEntireCell(true)
    .matchCase(false)
    .findNext();

  if (!match) throw new Error("No encontramos este código en la lista de invitados.");

  const row = match.getRow();
  const values = sheet.getRange(row, 1, 1, APP.GUEST_HEADERS.length).getValues()[0];
  const capacity = positiveInteger_(values[3]);
  if (capacity < 1) throw new Error("Esta invitación no tiene un cupo asignado válido.");
  const entered = clampInteger_(values[5], 0, capacity);
  const remaining = Math.max(capacity - entered, 0);
  const confirmation = cleanConfirmation_(values[4]);
  const status = calculateStatus_(confirmation, entered, remaining);

  if (values[6] !== remaining || values[7] !== status) {
    sheet.getRange(row, 7, 1, 2).setValues([[remaining, status]]);
  }

  return {
    sheet,
    row,
    codigo: code,
    invitado: cleanText_(values[1], 160) || "Invitación sin nombre",
    telefono: cleanText_(values[2], 40),
    cupoAsignado: capacity,
    confirmacion,
    ingresaron: entered,
    cupoRestante: remaining,
    estado: status,
    horaAcceso: values[8] instanceof Date ? values[8] : null
  };
}

function refreshGuestRow_(sheet, rowNumber) {
  const row = sheet.getRange(rowNumber, 1, 1, APP.GUEST_HEADERS.length).getValues()[0];
  const guestName = cleanText_(row[1], 160);
  const capacity = positiveInteger_(row[3]);
  if (!guestName || capacity < 1) return;

  const entered = clampInteger_(row[5], 0, capacity);
  const confirmation = cleanConfirmation_(row[4]);
  const remaining = Math.max(capacity - entered, 0);
  const status = calculateStatus_(confirmation, entered, remaining);

  sheet.getRange(rowNumber, 4, 1, 5).setValues([[
    capacity,
    confirmation,
    entered,
    remaining,
    status
  ]]);
  sheet.getRange(rowNumber, 14).setValue(new Date());
}

function calculateStatus_(confirmation, entered, remaining) {
  if (remaining <= 0) return "Utilizado";
  if (entered > 0) return "Ingreso parcial";
  if (String(confirmation).toLowerCase().includes("no podr")) return "No asistirá";
  return "Disponible";
}

function createUniqueCode_(existingCodes) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const seed = Utilities.getUuid().replace(/-/g, "").toUpperCase();
    let body = "";
    for (let index = 0; index < APP.CODE_LENGTH; index += 1) {
      const source = seed.charCodeAt(index) + seed.charCodeAt(seed.length - index - 1) + index;
      body += alphabet[source % alphabet.length];
    }
    const code = `${APP.CODE_PREFIX}-${body}`;
    if (!existingCodes.has(code)) return code;
  }
  throw new Error("No fue posible generar un código único. Intenta nuevamente.");
}

function buildInvitationUrl_(baseUrl, code) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}codigo=${encodeURIComponent(code)}`;
}

function buildScannerUrl_(webAppUrl, code) {
  return `${webAppUrl}?view=scanner&codigo=${encodeURIComponent(code)}`;
}

function getRequiredConfig_() {
  const properties = PropertiesService.getScriptProperties();
  const invitationBaseUrl = properties.getProperty("INVITATION_BASE_URL");
  const webAppUrl = properties.getProperty("WEB_APP_URL");
  if (!invitationBaseUrl || !webAppUrl) {
    throw new Error("Primero ejecuta “Configurar URLs y PIN” desde el menú Invitaciones QR.");
  }
  return { invitationBaseUrl, webAppUrl };
}

function verifyStaffPin_(pin) {
  const storedPin = PropertiesService.getScriptProperties().getProperty("STAFF_PIN");
  if (!storedPin) throw new Error("El PIN del personal todavía no está configurado.");
  if (String(pin || "") !== storedPin) throw new Error("PIN incorrecto.");
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("Ejecuta setupSystem desde la hoja de cálculo.");
  return SpreadsheetApp.openById(id);
}

function getGuestsSheet_() {
  const sheet = getSpreadsheet_().getSheetByName(APP.GUESTS_SHEET);
  if (!sheet) throw new Error("No existe la hoja Invitados. Ejecuta setupSystem.");
  return sheet;
}

function getAccessLogSheet_() {
  const spreadsheet = getSpreadsheet_();
  return getOrCreateSheet_(spreadsheet, APP.ACCESS_LOG_SHEET, APP.LOG_HEADERS);
}

function getOrCreateSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);

  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const differs = headers.some((header, index) => currentHeaders[index] !== header);
  if (differs) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function parseRequestBody_(e) {
  if (!e) return {};
  const contents = e.postData && e.postData.contents;
  if (contents) {
    try {
      return JSON.parse(contents);
    } catch (error) {
      // Continúa con parámetros de formulario cuando el cuerpo no sea JSON.
    }
  }
  return e.parameter || {};
}

function createPublicOutput_(payload, callback) {
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  const callbackName = String(callback || "");

  if (/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callbackName)) {
    return ContentService
      .createTextOutput(`${callbackName}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeCode_(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 24);
}

function normalizeBaseUrl_(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  return url.endsWith("/") ? url : `${url}/`;
}

function cleanText_(value, maxLength) {
  return String(value == null ? "" : value)
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

function cleanConfirmation_(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.includes("no podr") || normalized === "no") return "No podré asistir";
  if (normalized.includes("sí") || normalized.includes("si asistir") || normalized === "si") return "Sí asistiré";
  return "Pendiente";
}

function positiveInteger_(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function clampInteger_(value, minimum, maximum) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return minimum;
  return Math.min(Math.max(parsed, minimum), maximum);
}

function formatDate_(value) {
  return Utilities.formatDate(new Date(value), APP.TIME_ZONE, "dd/MM/yyyy HH:mm:ss");
}
