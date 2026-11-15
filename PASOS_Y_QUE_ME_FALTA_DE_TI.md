# Qué configuras TÚ dentro de la app (no me tienes que responder nada para usarla)

Todo esto ya funciona con valores provisionales. Cuando quieras, lo cambias dentro de la app, sin volver a pedirme nada.

## 1. WhatsApp del organizador — LO PONES TÚ
- Dónde: Abre la app > abajo **Roles y WhatsApp > Organizador**
- Qué pones: tu WhatsApp en formato código país + número, sin + ni espacios. Ej: `529981234567`
- Para qué: ese número es el que usa el botón verde “Hablar con organizador” para todos.
- Si lo cambias de celular, vuelve a ponerlo ahí. No hay que recompilar nada.

## 2. Datos del jugador — YA VIENEN, LOS AMPLÍAS CUANDO QUIERAS
- Actuales: nombre, WhatsApp, posición, fecha de nacimiento (opcional), número de camiseta (opcional).
- Dónde se ven: **Roles y WhatsApp > Jugador libre**
- Cuando me pases tus campos definitivos, los agrego en `roles-whatsapp.js` sin tocar lo demás. Mientras tanto, usa estos.

## 3. Nombre y logo final — PROVISIONAL SM
- Ahora: **Sports Manager** + icono azul **SM**.
- Si quieres otro nombre u otro logo: cambia el nombre en `manifest.webmanifest` y en `index.html` (`<title>`) y reemplaza `icon-192.png` / `icon-512.png` por tus imágenes con el mismo nombre. Sube a GitHub y sube `version.json` a `3.0.1`. Todos lo ven actualizado.

## 4. Tu usuario de GitHub — PARA TU LINK
- Tu link va a ser: `https://TU-USUARIO.github.io/sports-manager-web/`
- Cambia `TU-USUARIO` por tu usuario real. No me lo tienes que pasar para que funcione, es solo para que copies tu link correcto.

## 5. Opcional, solo si quieres tiempo real instantáneo al milisegundo
- Ahora: auto-revisión cada 25 segundos con GitHub JSON (gratis, suficiente para torneos).
- Si después quieres instantáneo de verdad: crea cuenta gratis en Supabase / Firebase y pásame URL + clave pública (nunca la secreta). Yo conecto la app. No pagas nada.
