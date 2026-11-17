# GUIA PASO A PASO — sports-manager-web v4 — En vivo segundo a segundo, sin roles, sin recompilar

## Lo que vas a lograr
- 1 link que es tu programa en línea: `https://TU-USUARIO.github.io/sports-manager-web/`
- Instalado como programa en PC y como app en celular, con icono, sin tienda
- Actualiza segundo a segundo por WiFi / internet, sin recompilar, sin reinstalar, sin resetear
- Sin apartado de roles: todos son jugadores, quien envía inscripción es Capitán, Organizador solo uno con clave

## PASO 1 — Subir todo a tu repo sports-manager-web
1. Entra a github.com y abre tu repo **`sports-manager-web`**.
2. **Add file > Upload files**.
3. Arrastra **TODO el contenido** de esta carpeta a la raíz del repo (no la carpeta en sí).
   - Deben quedar en la raíz: `index.html`, `live-sync.js`, `live-tick.json`, `manifest.webmanifest`, `sw.js`, `version.json`, etc.
   - Si ya tenías la versión anterior, **borra** `roles-whatsapp.js` y `auto-sync.js` del repo. Ya no existen. Si los dejas, no pasa nada grave, pero ya no se usan.
4. **Commit changes**.

## PASO 2 — Activar GitHub Pages (gratis)
1. En tu repo: **Settings > Pages**.
2. **Branch:** `main` / `/ (root)` > **Save**.
3. Espera 1-2 minutos. Te muestra: `Your site is live at https://TU-USUARIO.github.io/sports-manager-web/`
4. Abre ese link. Debe verse tu app tal cual, sin ningún apartado que diga “Soy Organizador / Capitán / Jugador”.
   - Si ves 404, espera 2 minutos más y recarga. Si sigue, revisa que `index.html` esté en la raíz.

## PASO 3 — Instalar como programa en línea (1 sola vez por dispositivo)
Haz esto una sola vez en cada dispositivo. Después ya no instalas nada más.

### PC Windows
1. Abre el link en **Chrome** o **Edge**.
2. Menú ⋮ > **Instalar Sports Manager**.
3. Queda con icono en Escritorio / Inicio. Ábrelo desde ahí, abre en ventana propia, sin barra del navegador.
4. Déjalo abierto conectado a WiFi. Se actualiza solo cada 1 segundo.

### Android
1. Abre el link en **Chrome**.
2. Menú ⋮ > **Agregar a pantalla principal / Instalar app**.
3. Queda con icono como cualquier app.

### iPhone
1. Abre el link en **Safari** (tiene que ser Safari).
2. **Compartir** > **Agregar a pantalla de inicio** > **Agregar**.
3. Queda con icono como cualquier app.

## PASO 4 — Verificar que ya NO existe el apartado de roles
1. Abre la app. Abajo a la derecha solo debe verse el botón verde **“Hablar con organizador”**.
2. Arriba a la derecha solo debe verse la pastilla **“EN VIVO • hace Xs + ⚙️ Sincronización”**.
3. **NO** debe haber ningún botón que diga “Soy Organizador / Capitán / Jugador” ni ningún panel “Roles y WhatsApp”. Si lo ves, es que subiste la versión vieja. Vuelve al Paso 1 y borra `roles-whatsapp.js` del repo.

## PASO 5 — Configurar WhatsApp del Organizador (1 minuto, dentro de la app)
1. Pulsa arriba **⚙️ Sincronización**.
2. En **WhatsApp del Organizador**, escribe tu número: código país + número, sin + ni espacios. Ej: `529981234567`.
3. **Guardar WhatsApp**.
4. Listo. El botón verde ahora le escribe a ese número a cualquiera.

## PASO 6 — Probar el en vivo segundo a segundo (la prueba que pediste)
Haz esto con PC + celular, los 2 conectados a la misma WiFi, los 2 con la app abierta:

1. En la PC, entra como Organizador con tu clave (Usuario + contraseña que ya tienes). Solo hay un Organizador, eres tú.
2. En el celular, **NO entres con clave**. Solo mira como jugador.
3. En la PC, cambia algo y pulsa **Guardar en GitHub** (en Cargar datos).
   - La app sube sola `live-tick.json`.
4. Mira el celular: arriba debe decir **EN VIVO • hace 0s** y en 1-10 segundos debe aparecer el cambio, sin recargar tú, sin reinstalar, sin compilar.
5. Prueba al revés: en el celular, envía una inscripción a un torneo (pon equipo + tu nombre + tu WhatsApp + jugadores).
   - Al enviarla, **TÚ eres el Capitán** de ese equipo. No elegiste ningún rol, tu acción te hizo Capitán.
6. En la PC como Organizador, aprueba esa inscripción.
   - El equipo se crea con `Capitán = tú, quien la envió`.
7. En el celular debe aparecer el equipo nuevo en 1 segundo, sin hacer nada.

Si no se ve en 10 segundos:
- Revisa que los 2 tengan internet / WiFi.
- Pulsa en el celular **⚙️ Sincronización > Recargar ahora desde GitHub**.
- Revisa que en la PC sí se haya guardado en GitHub (debe decir “Guardado en GitHub correctamente”).

## PASO 7 — (Opcional) Modo instantáneo <1s con Supabase gratis, sin compilar
Solo si quieres que llegue en menos de 1 segundo aunque GitHub tarde:

1. Entra a supabase.com > New Project (gratis) > crea proyecto.
2. En ese proyecto: **Settings > API** > copia **Project URL** y **anon public key** (la pública, nunca la secreta).
3. En la app: **⚙️ Sincronización > Modo instantáneo** > pega URL + clave > **Guardar Supabase** > **Probar conexión**.
4. Listo. Ahora los cambios viajan por Supabase Realtime en menos de 1 segundo, sin tocar código, sin recompilar.
5. Si lo dejas vacío, sigues en modo GitHub cada 1s. No pasa nada.

## PASO 8 — Cuando cambias algo, ¿qué haces?
1. Cambia lo que quieras como Organizador.
2. Pulsa **Guardar en GitHub**.
3. Listo. Todos lo ven en vivo. No toques `version.json`, no recompiles, no reinstales.

## Si algo no se ve actualizado
1. Cierra y vuelve a abrir la app.
2. Pulsa **⚙️ Sincronización > Recargar ahora**.
3. Si tienes cambios sin guardar, la app NO te los sobreescribe a propósito. Te sale “Hay información nueva — Actualizar ahora”. Guarda primero tus cambios, luego pulsa Actualizar.

## Preguntas
**¿Necesito compilar algo para el en vivo?** NO. Todo se configura dentro de la app.
**¿Cada vez que cambio algo tengo que reinstalar?** NO.
**¿Se borran los torneos cuando actualizo?** NO. Los datos viven en GitHub / navegador, no en la instalación.
**¿Funciona sin internet?** Después de la primera carga abre sin internet para ver lo último. Para ver cambios de otros, necesita WiFi / internet, como WhatsApp.
**¿Hay varios organizadores?** NO. Solo uno, el de la clave.
**¿Cómo sé quién es Capitán?** El que envió la inscripción. Al aprobarla queda guardado como Capitán del equipo.
