# Caribe Sports Web — caribe-sports — v10 EN VIVO

**Programa en línea instalable. Se actualiza segundo a segundo por WiFi / internet. Sin recompilar, sin reinstalar, sin pagar servidor, sin cuentas de tienda.**

Repo: **`caribe-sports`**
Link: `https://TU-USUARIO.github.io/caribe-sports/`
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
1. En GitHub, abre tu repo **`caribe-sports`**.
2. **Add file > Upload files** > arrastra **todo el contenido** de esta carpeta a la raíz > **Commit changes**.
3. **Settings > Pages** > Branch: `main` / `/ (root)` > **Save**.
4. Espera 1-2 minutos y abre: `https://TU-USUARIO.github.io/caribe-sports/`

## Instalar como programa en línea (1 sola vez por dispositivo, sin tienda)
- **PC Windows:** abre el link en Chrome / Edge > menú ⋮ > **Instalar Caribe Sports**. Queda con icono en Escritorio / Inicio, abre en ventana propia.
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


## v13 — Archivo COMPLETO + Enlazado para siempre

- **Un solo archivo con TODOS los datos adentro**: torneos, equipos, jugadores, partidos, noticias, biblioteca, cuentas, inscripciones, solicitudes, agentes libres, WhatsApp, config. No necesitas otros JSON. Abre `index.html` y ya está todo.
- **Se actualiza solo cada segundo, sobre la marcha, para siempre**:
  1) `localStorage + IndexedDB` — queda guardado en ese navegador aunque cierres la pestaña.
  2) `BroadcastChannel + storage` — todas las pestañas del mismo navegador se actualizan en <1s.
  3) **Archivo enlazado** — pulsa en el menú lateral `🔗 Enlazar este archivo` y elige dónde guardarlo. Cada cambio se escribe solo en ese mismo archivo, cada segundo, para siempre. No vuelves a descargar.
  4) **Descargar copia** — `⬇ Descargar copia con todos los datos` genera un HTML nuevo con TODOS los datos actuales adentro, listo para subir a GitHub o guardar.
  5) MQTT / Trystero / GitHub (live-sync) siguen funcionando para otros dispositivos.
- **En iPhone**: no se puede enlazar archivo directo (Safari). Usa `Descargar copia` para guardar el archivo completo. Tus datos sí quedan guardados para siempre en ese iPhone (IndexedDB).
- **Incluye v12**: capitán siempre es jugador, para inscribir equipo hay que estar registrado como Jugador.

### Cómo usarlo para siempre
1. Abre `Caribe-Sports-COMPLETO.html` (o `index.html`) en tu navegador (Chrome en PC es lo mejor para enlazar).
2. En el menú lateral, pulsa `🔗 Enlazar este archivo` y guarda el archivo donde quieras (ej: Escritorio / Caribe-Sports-COMPLETO.html).
3. Listo. Cada cambio que hagas (nuevo equipo, jugador, partido, inscripción) se escribe solo en ese archivo. Si abres el archivo mañana, tiene todo.
4. Para subir a GitHub, usa `Descargar copia` y sube ese archivo como `index.html`.
