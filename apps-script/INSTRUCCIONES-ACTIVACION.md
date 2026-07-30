# Activación de mejoras: WhatsApp y seguimiento de envíos

## Archivos

- `apps-script/Code.gs`: sustituye completamente el contenido actual de Code.gs.
- `apps-script/Scanner.html`: no requiere cambios; se incluye solo como referencia.

## Nuevas columnas en Invitados

A–N conservan la estructura actual.

- O: Enviar por WhatsApp
- P: Invitación enviada
- Q: Fecha de envío
- R: Observaciones

## Activación

1. Abre la hoja de Google Sheets del evento.
2. Ve a Extensiones > Apps Script.
3. Abre `Code.gs`.
4. Haz una copia de seguridad del código actual.
5. Borra todo y pega el contenido del nuevo `Code.gs`.
6. Guarda.
7. Regresa a Google Sheets y actualiza la página.
8. En el menú `Invitaciones QR`, ejecuta `1. Preparar o actualizar hojas`.
9. Acepta permisos si Google los solicita.
10. Ejecuta `3. Generar o actualizar invitaciones`.

## Uso diario

1. Captura nombre/familia, teléfono y cupo.
2. Ejecuta `3. Generar o actualizar invitaciones`.
3. Haz clic en `Enviar por WhatsApp` en la columna O.
4. Revisa el número y el mensaje antes de enviarlo.
5. Cuando hayas enviado el mensaje, marca la casilla de la columna P.
6. La fecha se registrará automáticamente en la columna Q.
7. Usa la columna R para observaciones.

También puedes seleccionar cualquier celda de la fila y usar:

`Invitaciones QR > 5. Marcar fila seleccionada como enviada`.

## Actualizar la app web

Como `Code.gs` también contiene el backend del pase y del escáner:

1. Apps Script > Implementar > Administrar implementaciones.
2. Edita la implementación actual.
3. Selecciona `Nueva versión`.
4. Implementa.

Al editar la implementación existente, la URL `/exec` se conserva.
