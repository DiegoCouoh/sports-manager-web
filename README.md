# Sports Manager Web — sports-manager-web

**Un solo link gratis para PC + Android + iPhone. Sin pagar servidor, sin cuentas de tienda, sin recompilar, sin reinstalar, sin resetear.**

Repo: **`sports-manager-web`**
Link cuando lo publiques: `https://TU-USUARIO.github.io/sports-manager-web/`
> Cambia `TU-USUARIO` por tu usuario de GitHub. Ese es tu link. Ese link ES tu programa.

## ¿Qué es esto?
Tu app original de torneos **tal cual**, sin cambiar nada de cómo funciona, + 3 añadidos:
1. **PWA instalable** — se instala como programa/app desde el navegador, con icono, en PC, Android y iPhone.
2. **Auto-actualización** — cuando publicas algo nuevo, todos se actualizan solos al abrir. No hay que reinstalar.
3. **Roles + WhatsApp** — módulo `roles-whatsapp.js`:
   - Botón verde flotante **“Hablar con organizador por WhatsApp”** para cualquiera, sin restricción.
   - **Organizador:** invita con link público, tiene todas las funciones, abre/cierra inscripciones, guarda su WhatsApp.
   - **Capitán:** registra equipo solo si inscripciones abiertas, agrega/quita jugadores de su equipo **solo** si inscripciones abiertas, designa nuevo capitán y avisa por WhatsApp al nuevo capitán y al organizador.
   - **Jugador:** entra como agente libre, habla por WhatsApp con capitanes de equipos con menos de 14 jugadores, acepta/rechaza invitación, sale del equipo.

## Archivos (todo en la raíz del repo, así como está)
| Archivo | Para qué |
|---|---|
| `index.html` | Tu app original + PWA + auto-sync + roles. No toques nada más si no quieres. |
| `manifest.webmanifest` | Para que se instale como app |
| `sw.js` | Para abrir sin internet tras la primera carga |
| `icon-192.png` / `icon-512.png` | Iconos (provisional SM, lo cambias cuando quieras) |
| `version.json` | Número de versión. Súbelo cuando publiques algo nuevo |
| `auto-sync.js` | Revisa versión nueva + datos cada 25s |
| `roles-whatsapp.js` | Roles + WhatsApp. No toca tu lógica original |
| `.nojekyll` | Para que GitHub Pages sirva todo tal cual |
| `GUIA-PASO-A-PASO.md` | Paso a paso completo |
| `PASOS_Y_QUE_ME_FALTA_DE_TI.md` | Lo que tú configuras dentro de la app cuando quieras |

## Publicar en 5 minutos (gratis)
1. En GitHub, abre tu repo **`sports-manager-web`** (si no existe, créalo con ese nombre exacto).
2. Sube **todo el contenido de esta carpeta** a la raíz del repo (no dentro de otra carpeta). Puedes arrastrar los archivos en GitHub > Add file > Upload files.
3. Ve a **Settings > Pages** > Branch: `main` / `/ (root)` > **Save**.
4. Espera 1-2 minutos y abre: `https://TU-USUARIO.github.io/sports-manager-web/`
5. Listo. Ese link lo compartes con todos.

## Instalar 1 sola vez en cada dispositivo (no es publicar en tienda)
- **PC Windows:** abre el link en Chrome / Edge > menú ⋮ > **Instalar Sports Manager**.
- **Android:** abre el link en Chrome > menú ⋮ > **Agregar a pantalla principal / Instalar app**.
- **iPhone:** abre el link en Safari > Compartir > **Agregar a pantalla de inicio**.

Después **nunca más instalas nada**. Cada vez que abres, se actualiza sola.

## Cuando cambias algo
1. Cambia lo que quieras en `index.html`
2. Sube el número en `version.json` (ej. `3.0.0` → `3.0.1`)
3. Sube a GitHub (o pulsa Guardar en GitHub dentro de la app)
4. Listo. Todos lo ven al abrir, sin reinstalar, sin recompilar, sin pagar.

## ¿Necesito Play Store / App Store?
- **Para que FUNCIONE: NO.** Con el link ya funciona en los 3.
- **Para que APAREZCA buscando en la tienda: SÍ.** Play Store $25 una sola vez, App Store $99/año. Solo si quieres que te encuentren buscando en la tienda. No lo necesitas para usarla.

## ¿Necesito pagar un servidor?
**NO.** GitHub Pages es tu servidor gratis + tu GitHub JSON es tu base de datos gratis. Si después quieres tiempo real instantáneo al milisegundo, se puede conectar Supabase / Firebase gratis, pero para torneos con esta auto-revisión cada 25 segundos es suficiente.

## WhatsApp del organizador
No viene con un número puesto (por privacidad). El organizador lo pone **dentro de la app**:
`Roles y WhatsApp > Organizador > Tu WhatsApp` — formato: código país + número, sin + ni espacios. Ej: `529981234567`.
Ese número es el que usa el botón verde para todos.

## Datos del jugador
Campos actuales en Jugador libre: nombre, WhatsApp, posición, fecha de nacimiento (opcional), número de camiseta (opcional). Si después quieres otros campos, se agregan en `roles-whatsapp.js` sin tocar lo demás.
