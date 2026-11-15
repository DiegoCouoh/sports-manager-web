# Sports Manager Web — sports-manager-web — v4 EN VIVO

**Programa en línea instalable. Se actualiza segundo a segundo por WiFi / internet. Sin recompilar, sin reinstalar, sin pagar servidor, sin cuentas de tienda.**

Repo: **`sports-manager-web`**
Link: `https://TU-USUARIO.github.io/sports-manager-web/`
> Cambia `TU-USUARIO` por tu usuario de GitHub. Ese link ES tu programa.

## Regla nueva — SIN apartado de roles, por ACCIONES

No hay selector de “Soy Organizador / Capitán / Jugador”. Desapareció por completo.

- **Todos son jugadores.**
- **Quien envía la solicitud de inscripción al torneo ES el Capitán** de ese equipo. Cuando el Organizador la aprueba, tu app ya crea el equipo con `capitan = quien la envió`. No hay que elegirlo, no hay panel de capitán.
- **Organizador solo hay UNO:** quien tiene la clave (Usuario + contraseña que ya tienes). Solo él puede entrar con clave y modificar torneos en curso. No hay otro organizador.
- **Cualquiera** puede hablar con el Organizador por WhatsApp con el botón verde flotante.

## ¿Cómo se actualiza segundo a segundo?

Tienes 2 modos. Los 2 son sin compilar nada, sin reinstalar. Se configuran dentro de la app, no en el código.

### Modo 1 — GitHub cada 1s (ya incluido, sin configurar nada)
- La app revisa cada **1 segundo** un archivo diminuto `live-tick.json`.
- Cuando el Organizador pulsa **Guardar en GitHub**, la app sube sola ese `live-tick.json` con la hora actual.
- Todos los celulares y PC conectados lo ven y recargan en silencio.
- Si tienes cambios sin guardar, **NO te los sobreescribe**. Te sale: “Hay información nueva — Actualizar ahora” y tú decides.
- Nota honesta: GitHub puede tardar 2-10s en publicar. El chequeo es cada 1s, la llegada es 1-10s según GitHub.

### Modo 2 — Supabase instantáneo <1s (gratis, opcional)
- Si quieres que llegue en **menos de 1 segundo** aunque GitHub tarde, crea un proyecto gratis en Supabase y pega su URL + clave anónima (nunca la secreta) en: **⚙️ Sincronización > Modo instantáneo**.
- Se guarda en el navegador, no en el código. No hay que compilar, ni reinstalar.
- Si lo dejas vacío, sigues en Modo 1.

## Archivos (todo en la raíz del repo)
| Archivo | Para qué |
|---|---|
| `index.html` | Tu app original + en vivo + WhatsApp. Sin apartado de roles. |
| `live-sync.js` | En vivo cada 1s + Supabase + WhatsApp + ajustes. No toca tu lógica original. |
| `live-tick.json` | Reloj que avisa “hay algo nuevo”. Lo sube sola la app. |
| `manifest.webmanifest` | Para instalar como programa/app |
| `sw.js` | Para abrir sin internet tras la primera carga |
| `icon-192.png` / `icon-512.png` | Iconos (provisional SM) |
| `version.json` | Versión 4.0.0 |
| `.nojekyll` | Para que GitHub Pages sirva todo tal cual |
| `GUIA-PASO-A-PASO.md` | Paso a paso completo |
| `PASOS_Y_QUE_ME_FALTA_DE_TI.md` | Lo que configuras tú dentro de la app |

## Publicar (5 minutos, gratis)
1. En GitHub, abre tu repo **`sports-manager-web`**.
2. **Add file > Upload files** > arrastra **todo el contenido** de esta carpeta a la raíz > **Commit changes**.
3. **Settings > Pages** > Branch: `main` / `/ (root)` > **Save**.
4. Espera 1-2 minutos y abre: `https://TU-USUARIO.github.io/sports-manager-web/`

## Instalar como programa en línea (1 sola vez por dispositivo, sin tienda)
- **PC Windows:** abre el link en Chrome / Edge > menú ⋮ > **Instalar Sports Manager**. Queda con icono en Escritorio / Inicio, abre en ventana propia.
- **Android:** abre el link en Chrome > menú ⋮ > **Agregar a pantalla principal / Instalar app**.
- **iPhone:** abre el link en Safari > Compartir > **Agregar a pantalla de inicio**.
- Después **nunca más instalas nada**. Cada vez que abres, se actualiza sola por WiFi.

No uses `.exe` / `.aab` / `.ipa` para esto: cada cambio te obligaría a recompilar y reinstalar. El link es lo que permite el en vivo sin recompilar.

## Cuando cambias algo
1. Cambia lo que quieras como Organizador en la app.
2. Pulsa **Guardar en GitHub** (en Cargar datos).
3. La app sube sola `live-tick.json`.
4. Todos lo ven en 1 segundo (Modo GitHub) o en menos de 1 segundo (Modo Supabase).
5. No hay que tocar `version.json` a mano, no hay que recompilar, no hay que reinstalar.

## WhatsApp del Organizador
No viene con número puesto. El Organizador lo pone dentro de la app:
**⚙️ Sincronización > WhatsApp del Organizador** o en **Inscripciones > WhatsApp del Organizador**.
Formato: código país + número, sin + ni espacios. Ej: `529981234567`.
Ese número es el que usa el botón verde para todos.

## ¿Necesito Play Store / App Store?
- **Para que funcione: NO.**
- **Para que aparezca buscando en la tienda: SÍ.** Play $25 una vez, App Store $99/año. Solo si quieres que te encuentren buscando ahí.
