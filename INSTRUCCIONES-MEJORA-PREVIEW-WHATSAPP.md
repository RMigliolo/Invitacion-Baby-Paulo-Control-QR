# Mejora de vista previa para WhatsApp

## Qué archivos sustituir

### En GitHub Pages

Sube o sustituye:

- `index.html`
- `compartir.html` (nuevo)
- `assets/distribucion/preview-baby-paulo-2026.jpg` (nuevo)

El resto del sitio puede mantenerse sin cambios. El ZIP completo incluye todos los archivos por comodidad.

### En Google Apps Script

Sustituye:

- `apps-script/Code.gs`

`Scanner.html` no cambia, pero se incluye dentro del paquete completo.

## Activación

1. Sube los archivos de GitHub y espera a que GitHub Pages termine de publicar.
2. Abre la hoja de cálculo.
3. Ve a **Extensiones > Apps Script**.
4. Sustituye `Code.gs`, guarda y crea una **nueva versión** de la implementación web existente.
5. Regresa a la hoja y actualiza la página.
6. Ejecuta **Invitaciones QR > 4. Regenerar enlaces de WhatsApp**.
7. La columna J deberá mostrar enlaces con esta forma:

   `https://rmigliolo.github.io/Invitacion-Baby-Paulo-Control-QR/compartir.html?pv=20260801#codigo=BP-XXXXXXXX`

8. Envía una prueba a un chat nuevo o a un número que no haya recibido antes ese enlace.

## Cómo funciona la mejora

- `compartir.html` es una página muy ligera que contiene los metadatos de imagen al inicio.
- El código personal se coloca después de `#`. Esa parte no se envía al rastreador, por lo que todas las invitaciones reutilizan una sola vista previa estable.
- Al tocar el enlace, el navegador lee el código y redirige a `index.html?codigo=...`, conservando el pase personal.
- La imagen nueva es JPEG baseline de 1200 × 630 y usa un nombre nuevo para evitar la caché de la imagen anterior.
- El parámetro `pv=20260801` permite renovar las URLs distribuidas sin cambiar los códigos de invitación.

## Para una futura actualización de la imagen

1. Reemplaza la imagen por otra de 1200 × 630.
2. Usa un nombre nuevo, por ejemplo `preview-baby-paulo-2026-v2.jpg`.
3. Actualiza la ruta en `index.html` y `compartir.html`.
4. Cambia `PREVIEW_VERSION` en `Code.gs`.
5. Ejecuta otra vez **Regenerar enlaces de WhatsApp**.
