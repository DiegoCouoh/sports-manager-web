# GUIA PASO A PASO — sports-manager-web — De 0 a funcionando en PC + Android + iPhone, gratis

## Lo que vas a lograr
- 1 link que funciona en los 3: `https://TU-USUARIO.github.io/sports-manager-web/`
- Instalado como programa/app en cada dispositivo, con icono
- Cuando publicas algo nuevo, todos se actualizan solos, sin reinstalar, sin recompilar, sin resetear, sin pagar servidor

## PASO 1 — Subir todo a tu repo sports-manager-web (5 minutos)
1. Entra a github.com y abre tu repositorio **`sports-manager-web`**.
   - Si aún no lo creaste: New repository > Repository name: `sports-manager-web` > Public > Create.
2. Dentro del repo: **Add file > Upload files**.
3. Arrastra **TODO el contenido de esta carpeta** (no la carpeta en sí, sino los archivos que están dentro: `index.html`, `manifest.webmanifest`, `sw.js`, `icon-*.png`, `version.json`, `auto-sync.js`, `roles-whatsapp.js`, `.nojekyll`, `README.md`, etc.)
   - Ojo: deben quedar en la **raíz** del repo, no dentro de una subcarpeta `sports-manager-web/sports-manager-web/`.
4. Pulsa **Commit changes**.

## PASO 2 — Activar GitHub Pages (2 minutos, gratis)
1. En tu repo: **Settings** (arriba a la derecha) > en el menú izquierdo **Pages**.
2. En **Build and deployment** > **Branch**: elige `main` y carpeta `/ (root)`.
3. Pulsa **Save**.
4. Espera 1-2 minutos. Recarga la página de Pages. Te va a mostrar: `Your site is live at https://TU-USUARIO.github.io/sports-manager-web/`
5. Abre ese link. Debe verse tu app de torneos tal cual.
   - Si ves 404, espera 2 minutos más y recarga. Si sigue, revisa que `index.html` esté en la raíz, no en una carpeta.

## PASO 3 — Instalar en cada dispositivo (1 sola vez por dispositivo)
Haz esto una sola vez en cada dispositivo. Después ya no instalas nada más.

### PC Windows
1. Abre el link en **Chrome** o **Edge**.
2. Menú ⋮ (arriba derecha) > **Instalar Sports Manager** / **Aplicaciones > Instalar**.
   - Si no sale, en la barra de direcciones sale un icono de instalar (computadora + flecha).
3. Queda con icono en Escritorio / Inicio. Ábrelo desde ahí, abre en ventana propia, sin barra del navegador.

### Android
1. Abre el link en **Chrome**.
2. Menú ⋮ > **Agregar a pantalla principal** / **Instalar app**.
3. Acepta. Queda con icono como cualquier app, abre en pantalla completa.
4. No necesitas Play Store.

### iPhone
1. Abre el link en **Safari** (tiene que ser Safari, no Chrome).
2. Botón **Compartir** (cuadrado con flecha arriba) > **Agregar a pantalla de inicio** > **Agregar**.
3. Queda con icono como cualquier app.
4. No necesitas App Store.

## PASO 4 — Configurar WhatsApp del organizador (1 minuto, dentro de la app)
1. Abre la app y pulsa abajo **Roles y WhatsApp**.
2. En **Organizador**, escribe tu WhatsApp: código país + número, sin + ni espacios. Ej: `529981234567`.
3. Pulsa **Guardar WhatsApp del organizador**.
4. Listo. Ahora el botón verde flotante **“Hablar con organizador”** le llega a ese número a **cualquiera**, sin restricción.
5. También puedes copiar el **link público** en esa misma sección y compartirlo por WhatsApp: **📤 Compartir link por WhatsApp**.

## PASO 5 — Probar los roles (5 minutos)
Haz esta prueba con 2 celulares o con PC + celular:

### Como Organizador
1. Abajo, pulsa **Soy: 👑 Organizador**.
2. En Roles y WhatsApp, abre/cierra inscripciones de un torneo.
3. Crea / edita torneos como siempre. Todo lo demás de tu app sigue igual.

### Como Capitán
1. En otro dispositivo, pulsa **Soy: 🧢 Capitán**.
2. Pon tu nombre, tu WhatsApp y el nombre de tu equipo.
3. Ve a **Inscripciones** en el menú principal y registra tu equipo (solo deja hacerlo si inscripciones abiertas).
4. En **Roles y WhatsApp > Capitán**, agrega un jugador.
5. Cierra inscripciones como Organizador e intenta agregar otro jugador como Capitán: debe bloquearse. Esa es la regla que pediste.
6. Prueba **Designar nuevo capitán**: escribe el nombre del nuevo capitán y pulsa el botón. Debe abrir WhatsApp con el aviso listo para el organizador y el nuevo capitán.

### Como Jugador
1. En otro dispositivo, pulsa **Soy: ⚽ Jugador libre**.
2. Llena: nombre, WhatsApp, posición, fecha de nacimiento (opcional), número (opcional) > **Entrar como agente libre**.
3. Baja a **Equipos con lugar (menos de 14)** y pulsa **Pedir lugar por WhatsApp al capitán**. Debe abrir WhatsApp con el mensaje listo.
4. Como Capitán, invita a ese agente libre: **Invitar a mi equipo por WhatsApp**.
5. Como Jugador, en **Mis invitaciones** pulsa **✅ Aceptar** o **❌ Rechazar**.
6. Si aceptaste, prueba **🚪 Salir de mi equipo**. Debes quedar otra vez como agente libre.

## PASO 6 — Cuando cambias algo, ¿qué haces? (sin reinstalar)
1. Edita `index.html` (o lo que quieras) en tu computadora.
2. Abre `version.json` y sube el número: `3.0.0` → `3.0.1` → `3.0.2`...
3. Sube los archivos cambiados a GitHub (igual que en Paso 1) o pulsa **Guardar en GitHub** dentro de la app.
4. Listo. Todos los que abran la app van a ver un aviso dorado: **“Hay una nueva versión. Actualizar ahora”**. Pulsan y listo. No se borran torneos ni inscripciones.

## Si algo no se ve actualizado
1. Cierra la app por completo y vuelve a abrir.
2. Si sigue viejo, en el navegador: recarga con `Ctrl + Shift + R` (PC) o borra caché de ese sitio.
3. Revisa que `version.json` en GitHub sí tenga el número nuevo.
4. Revisa que en Pages la rama sea `main` y carpeta `/ (root)`.

## Preguntas que siempre hacen
**¿Necesito cuenta de Play Store / App Store para que funcione?** NO. Solo si quieres que aparezca buscando en la tienda.
**¿Tengo que pagar un servidor?** NO. GitHub Pages + GitHub JSON son gratis.
**¿Cada vez que cambio algo tengo que recompilar / reinstalar?** NO. Solo subes a GitHub y subes el número de `version.json`.
**¿Se borran los torneos cuando actualizo?** NO. Los datos viven en GitHub / navegador, no en la instalación. Actualizar la app no los borra.
**¿Funciona sin internet?** Después de la primera carga, abre sin internet para ver lo último que cargó. Para inscribirse o ver cambios de otros, necesita internet, como WhatsApp.

## ¿Y si después sí quiero Play Store / App Store?
No hay que rehacer la app. Se empaqueta el MISMO link con PWABuilder / Capacitor y se sube a la tienda. Dime cuando quieras hacerlo y te preparo ese paso, pero para usarla no lo necesitas.
