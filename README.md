# Invitación Baby Paulo — rama con control de acceso QR

Esta carpeta conserva el diseño actual de la invitación y añade una versión funcional con:

- invitación personalizada por familia o pase;
- código aleatorio como `BP-7K4M9X2Q`;
- QR individual dentro de la invitación;
- lista de invitados en Google Sheets;
- confirmación asociada al código correcto;
- pantalla móvil para el personal de acceso;
- registro de ingresos parciales y cupo restante;
- historial de movimientos en una hoja llamada `Accesos`;
- PIN del personal guardado en Script Properties.

## 1. Trabajar sin tocar la invitación que ya está publicada

En la terminal de VS Code, dentro de tu repositorio actual:

```bash
git checkout main
git pull origin main
git checkout -b feature/control-acceso-qr
```

Copia en esa rama los archivos de esta carpeta. Conserva también tu carpeta actual `assets/`, porque contiene imágenes, audio y la vista previa de la invitación.

Después guarda la rama:

```bash
git add .
git commit -m "Agregar invitaciones personalizadas y control de acceso QR"
git push -u origin feature/control-acceso-qr
```

Tu rama `main` seguirá intacta. La invitación actual no cambia mientras no fusiones la nueva rama.

> GitHub Pages normalmente publica una sola fuente por repositorio. Para probar esta rama en internet sin afectar la invitación actual, usa Live Server o súbela temporalmente a un segundo repositorio de pruebas. No cambies la configuración de Pages del repositorio actual hasta terminar las pruebas.

## 2. Archivos incluidos

```text
index.html                 Invitación con sección de pase personalizado
style.css                  Estilos originales más la tarjeta QR
script.js                  Personalización, QR y RSVP
apps-script/Code.gs        Backend, Google Sheets y control de accesos
apps-script/Scanner.html   Pantalla móvil que abre el QR
invitados-ejemplo.csv      Ejemplo de captura inicial
```

## 3. Crear la base en Google Sheets

1. Crea una hoja de cálculo nueva para este evento.
2. Entra en **Extensiones > Apps Script**.
3. Sustituye el contenido de `Code.gs` por el archivo `apps-script/Code.gs`.
4. Crea un archivo HTML llamado exactamente `Scanner`.
5. Pega dentro el contenido de `apps-script/Scanner.html`.
6. Guarda el proyecto.
7. Ejecuta manualmente `setupSystem` y acepta los permisos.
8. Regresa a Google Sheets y actualiza la página.
9. Aparecerá el menú **Invitaciones QR**.

La función crea estas columnas en `Invitados`:

```text
Código | Invitado/Familia | Teléfono | Cupo asignado | Confirmación |
Ingresaron | Cupo restante | Estado | Hora de acceso | Enlace invitación |
Enlace escáner | Predicción | Mensaje | Última actualización
```

También crea la hoja `Accesos`, donde queda un historial independiente de cada registro de entrada.

## 4. Desplegar Google Apps Script

1. En Apps Script abre **Implementar > Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Ejecutar como: **Yo**.
4. Quién tiene acceso: **Cualquier persona**.
5. Pulsa **Implementar**.
6. Copia la URL que termina en `/exec`.

Cuando modifiques `Code.gs` o `Scanner.html`, actualiza la implementación desde **Administrar implementaciones > Editar > Nueva versión**. No basta con guardar el código.

## 5. Configurar las URLs y el PIN

Primero publica o prueba la rama QR en una URL distinta de la invitación actual. Luego, en Google Sheets:

1. Abre **Invitaciones QR > Configurar URLs y PIN**.
2. Pega la URL pública de la invitación QR, por ejemplo:

```text
https://TU-USUARIO.github.io/Invitacion-Baby-Paulo-QR/
```

3. Pega la URL `/exec` de Apps Script.
4. Define un PIN de al menos 6 caracteres. Para el evento se recomienda usar 8 o más caracteres.

El PIN no se escribe en la hoja ni dentro del QR. Se guarda en las propiedades privadas del proyecto de Apps Script.

## 6. Conectar `script.js`

Abre `script.js` y cambia únicamente esta línea:

```js
apiEndpoint: "PEGA_AQUI_LA_URL_DE_APPS_SCRIPT"
```

por tu URL real:

```js
apiEndpoint: "https://script.google.com/macros/s/TU_IMPLEMENTACION/exec"
```

No reutilices el endpoint anterior de la confirmación si todavía apunta al Apps Script viejo. Esta rama necesita el nuevo backend incluido en esta carpeta.

## 7. Registrar familias y generar enlaces

En la hoja `Invitados`, captura al menos:

```text
Invitado/Familia | Teléfono | Cupo asignado
```

Ejemplo:

```text
Familia Rodríguez | 5512345678 | 4
Ana Martínez      | 5587654321 | 1
```

Luego usa **Invitaciones QR > Generar códigos y enlaces**.

El sistema llenará automáticamente:

- código único;
- ingresaron: `0`;
- cupo restante;
- estado: `Disponible`;
- enlace personalizado de la invitación;
- enlace del escáner.

La URL enviada al invitado tendrá esta forma:

```text
https://tu-sitio.com/?codigo=BP-7K4M9X2Q
```

Al abrirla, la invitación consulta Google Sheets, muestra el nombre de la familia, su cupo y genera su QR.

## 8. Flujo durante el evento

1. El invitado abre su invitación y muestra el QR.
2. El encargado lo escanea con la cámara normal del teléfono.
3. El QR abre la pantalla móvil de Apps Script.
4. El encargado escribe su PIN.
5. La pantalla muestra:

```text
Invitación: Familia Rodríguez
Cupo autorizado: 4
Personas ingresadas: 0
Cupo restante: 4
Estado: Disponible
```

6. El encargado indica cuántas personas llegaron y pulsa **Registrar ingreso**.
7. Si vuelven a mostrar el QR, aparecerá el total ya ingresado y el cupo restante.
8. Cuando el cupo llegue a cero, el estado cambia a `Utilizado` y se bloquean nuevos ingresos.

El sistema usa un bloqueo de Apps Script al escribir, para evitar que dos teléfonos registren el mismo cupo al mismo tiempo.

## 9. Prueba obligatoria antes del evento

Prueba como mínimo estos casos:

1. Familia con cupo 4; registrar 2 y después otras 2.
2. Intentar registrar una quinta persona.
3. Código inexistente.
4. PIN incorrecto.
5. Invitado que confirma que no asistirá.
6. Dos teléfonos intentando registrar la misma invitación.
7. Abrir la invitación desde iPhone, Android y computadora.
8. Escanear con datos móviles, no solo con el Wi-Fi de casa.

Lleva además una copia impresa o descargada de la lista. Google Sheets y Apps Script necesitan conexión a internet.

## 10. Seguridad y alcance comercial

Este sistema es adecuado para eventos pequeños y medianos como primera versión comercial. La protección se basa en:

- identificadores aleatorios, no en el número de personas dentro del QR;
- PIN separado para el personal;
- hoja privada;
- actualización atómica mediante `LockService`;
- historial de accesos.

No es todavía un sistema empresarial con cuentas por empleado, permisos por rol, funcionamiento sin internet, auditoría avanzada o múltiples eventos en una sola base. Esa sería una segunda etapa con backend propio y base de datos.

Para tu catálogo comercial, esta versión encaja como una categoría **Platinum QR**:

- **Estándar:** invitación, ubicación, cuenta regresiva y RSVP.
- **Premium:** lo anterior más música y personalización por familia.
- **Platinum QR:** lo anterior más lista de invitados, QR, cupos, escáner móvil e historial de accesos.

La recomendación es vender el control QR como un módulo adicional y no mezclarlo obligatoriamente con todas las invitaciones. Así puedes cobrar por nivel de complejidad y reutilizar la misma plantilla visual para distintos paquetes.
