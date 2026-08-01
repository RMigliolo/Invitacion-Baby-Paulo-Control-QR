# Actualización del control QR

## Archivos de GitHub Pages

Copia en la raíz del repositorio:

- `index.html`
- `script.js`
- `style.css`
- `scanner.html` **(archivo nuevo)**

El nuevo `scanner.html` es la pantalla profesional de control de acceso. Al estar alojada en GitHub Pages, ya no muestra la franja “Esta aplicación fue creada por un usuario” de Google Apps Script.

## Archivos de Google Apps Script

Reemplaza en el proyecto vinculado a Google Sheets:

- `Code.gs`
- `Scanner.html`

Después:

1. Guarda el proyecto.
2. Ve a **Implementar > Administrar implementaciones**.
3. Edita la implementación web existente.
4. Selecciona **Nueva versión** y pulsa **Implementar**.
5. Conserva la misma URL `/exec`. Si Google genera otra, actualiza `apiEndpoint` en `script.js` y `scanner.html`.
6. En la hoja, abre **Invitaciones QR > Configurar URLs y PIN** y confirma:
   - URL de GitHub Pages del repositorio.
   - URL `/exec` de Apps Script.
   - PIN del personal.
7. Ejecuta **Generar códigos y enlaces** para actualizar la columna **Enlace escáner**.

## Cambio de marca

En `github-pages/scanner.html`, busca:

```js
brandName: "Invitaciones Digitales"
```

y reemplázalo por el nombre de la empresa o firma.

## Mejoras incluidas

- El QR abre una página propia, sin la advertencia visual de Google.
- El campo de cantidad recibe el foco después de renderizarse y ya no depende del contenedor HTMLService.
- Sesión temporal del personal: el PIN no se guarda; se intercambia por un token de seis horas.
- El token se comparte entre nuevas pestañas del mismo navegador, facilitando el escaneo continuo.
- Registro idempotente con identificador único para reducir el riesgo de duplicados.
- Bloqueo de concurrencia en Apps Script para evitar que dos dispositivos excedan el cupo.
- Controles `+` y `−`, mensajes claros y recuperación ante respuestas lentas.
- Compatibilidad con enlaces QR anteriores: Apps Script los redirige al nuevo portal.

## Actualización de ubicación

La invitación muestra la ubicación de **Jardín Briselys** en:

**Avenida Adolfo López Mateos 59B, San Juan, 54900 Tultitlán de Mariano Escobedo, Estado de México, México.**

Se incluyen dos botones independientes:

- **Abrir en Google Maps:** usa las coordenadas `19.643694, -99.162709`.
- **Abrir en Apple Maps:** usa el enlace compartido `https://maps.apple/la/rWF7QCyMd4Z-hp`.

El mapa incrustado conserva las mismas coordenadas, por lo que los tres accesos apuntan al mismo lugar.

## Vista previa de WhatsApp

La distribución ahora utiliza `compartir.html`, una página ligera que conserva el código personal y redirige a la invitación principal. Después de subir esta versión y reemplazar `Code.gs`, ejecuta **Invitaciones QR > 4. Regenerar enlaces de WhatsApp**. Consulta `INSTRUCCIONES-MEJORA-PREVIEW-WHATSAPP.md`.
