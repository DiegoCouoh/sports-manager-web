/* ============================================================
   CARIBE SPORTS v18 - MEMORIA COMPARTIDA ENTRE NAVEGADORES
   + Quita SIEMPRE los 3 botones dentro de Inscripciones
   + Rechazo del organizador SÍ se refleja en el jugador y SÍ deja re-inscribirse
   + Cada sesión es por navegador (sessionStorage), identificada por Nombre + Teléfono
   + Cada cambio se guarda en caribe-datos.json en GitHub y se sondea cada 6s

   INSTALACIÓN SIN TOCAR index.html (igual que v17):
   1) Sube este archivo como v18-patch.js a la raíz
   2) Sube sw-v18.js renombrado a sw.js (reemplaza el viejo)
   3) En Cargar datos, pega tu token de GitHub UNA vez (o pégalo abajo en CARIBE_TOKEN_EMBEBIDO)
   ============================================================ */
(function(){
"use strict";
var LOG = function(){ try{ console.log.apply(console, ["[v18]"].concat([].slice.call(arguments))); }catch(_){} };

/* ---------- CONFIG GITHUB ---------- */
/* Si quieres que TODOS los navegadores (incluidos jugadores) puedan escribir en GitHub sin pegar token,
   crea un token fino (solo contents:write para caribe-sports) y pégalo aquí entre comillas.
   Es visible en el código, por eso debe ser SOLO para este repo. Si lo dejas vacío, solo el organizador
   con token en localStorage podrá escribir, y los jugadores quedarán en cola local. */
var CARIBE_TOKEN_EMBEBIDO = ""; // <-- PEGA AQUÍ TU TOKEN FINO SI QUIERES QUE JUGADORES TAMBIÉN ESCRIBAN
var CARIBE_OWNER = "diegocouoh";
var CARIBE_REPO = "caribe-sports";
var CARIBE_PATH = "caribe-datos.json";
var CARIBE_BRANCH = "main";

function v18_getGhCfg(){
  try{ var c = JSON.parse(localStorage.getItem("sm_github_config")||"null") || {}; }catch(_){ var c = {}; }
  if(!c.owner) c.owner = CARIBE_OWNER;
  if(!c.repo) c.repo = CARIBE_REPO;
  if(!c.token && CARIBE_TOKEN_EMBEBIDO) c.token = CARIBE_TOKEN_EMBEBIDO;
  if(!c.path) c.path = CARIBE_PATH;
  if(!c.branch) c.branch = CARIBE_BRANCH;
  return c;
}
function v18_b64(str){ try{ var bin = unescape(encodeURIComponent(str)); var out=""; for(var i=0;i<bin.length;i+=0x8000) out += btoa(bin.slice(i,i+0x8000)); return out; }catch(_){ return ""; } }
function v18_normTel(t){ return String(t||"").replace(/[^0-9]/g,""); }

/* ---------- 1) QUITAR SIEMPRE LOS 3 BOTONES DENTRO DE INSCRIPCIONES ---------- */
try{
  var st = document.createElement("style");
  st.id = "v18-style";
  st.textContent = [
    "#tabBtnInscribirEquipo, #tabBtnInscribirJugador, #tabBtnMiEquipo { display:none !important; visibility:hidden !important; }",
    "#inscripciones .tabs, #inscripciones .tab-button, #tabsInscripcion { display:none !important; }",
    "#seccionInvitacionCapitan { display:block !important; }",
    "#bannerInvitacion .v18-advert { background:#ff3b30; color:#fff; font-weight:800; padding:14px 12px; border-radius:10px; text-align:center; font-size:15px; line-height:1.35; margin-bottom:12px; }",
    "#v18-sync-estado { font-size:12px; opacity:.85; margin:6px 0 0 0; }"
  ].join("\n");
  document.head.appendChild(st);
}catch(_){}

function v18_ocultarPestanas(){
  try{
    ["tabBtnInscribirEquipo","tabBtnInscribirJugador","tabBtnMiEquipo"].forEach(function(id){
      var b = document.getElementById(id);
      if(b){ b.style.display="none"; b.style.visibility="hidden"; b.setAttribute("aria-hidden","true"); }
    });
    var sec = document.getElementById("inscripciones");
    if(sec){
      var tabs = sec.querySelector(".tabs");
      if(tabs) tabs.style.display="none";
      // Por si los botones se recrean con otro contenedor, ocultar cualquier botón dentro de inscripciones que diga Inscribir / Mi Equipo
      var btns = sec.querySelectorAll("button");
      btns.forEach(function(b){
        var t = (b.textContent||"").toLowerCase();
        var esDuplicado = (t.indexOf("inscribir equipo")>=0 || t.indexOf("inscribirse como jugador")>=0 || t.trim()==="mi equipo" || t.indexOf("mi equipo")>=0) && b.id !== "menuMiEquipo" && !b.closest("aside") && !b.closest("#appSidebar");
        if(esDuplicado && b.id !== "menuInscribirEquipo" && b.id !== "menuInscribirJugador"){
          // Solo ocultar si está dentro de la sección inscripciones y NO es del sidebar
          if(!b.closest("#appSidebar")) b.style.display="none";
        }
      });
    }
  }catch(_){}
}
/* Observador permanente: si la página vuelve a crear las pestañas, las vuelve a ocultar */
try{
  var obs = new MutationObserver(function(){ v18_ocultarPestanas(); });
  document.addEventListener("DOMContentLoaded", function(){
    v18_ocultarPestanas();
    var sec = document.getElementById("inscripciones") || document.body;
    try{ obs.observe(sec, {childList:true, subtree:true}); }catch(_){}
  });
  setTimeout(v18_ocultarPestanas, 500);
  setTimeout(v18_ocultarPestanas, 2000);
}catch(_){}
/* Envolver navegación para re-ocultar */
try{
  ["mostrarPagina","mostrarTabInscripcion","renderizarInscripciones"].forEach(function(fnName){
    var orig = window[fnName];
    if(typeof orig === "function" && !orig.__v18){
      var w = function(){ var r = orig.apply(this, arguments); try{ setTimeout(v18_ocultarPestanas, 50); }catch(_){} return r; };
      w.__v18 = true; window[fnName] = w; try{ eval(fnName + " = w"); }catch(_){}
    }
  });
}catch(_){}

/* ---------- 2) SESIÓN POR NAVEGADOR: Nombre + Teléfono, NO compartida ---------- */
/* La sesión vive SOLO en sessionStorage (por pestaña/navegador). Cada navegador tiene su propia sesión,
   aunque usen el mismo Nombre + Teléfono. NUNCA guardamos sesión en localStorage ni en GitHub. */
function v18_getSesion(){ try{ return JSON.parse(sessionStorage.getItem("sm_jugador")||"null"); }catch(_){ return null; } }
function v18_esOrg(){ try{ return typeof esOrganizador === "function" ? esOrganizador() : sessionStorage.getItem("sm_organizador")==="1"; }catch(_){ return false; } }
/* Mostrar en el menú lateral qué sesión tiene ESTE navegador */
function v18_mostrarSesionEnMenu(){
  try{
    var ses = v18_getSesion();
    var org = v18_esOrg();
    var el = document.getElementById("v18-sesion-info");
    if(!el){
      var side = document.getElementById("appSidebar") || document.querySelector("aside");
      if(!side) return;
      el = document.createElement("div");
      el.id = "v18-sesion-info";
      el.style.cssText = "margin:12px;padding:10px;border:1px solid #333;border-radius:10px;background:#111;font-size:13px;line-height:1.4;";
      side.appendChild(el);
    }
    if(org) el.innerHTML = "<b>👑 Organizador</b> (este navegador)<br><span style='opacity:.8;'>Diego Couoh</span>";
    else if(ses) el.innerHTML = "<b>👤 Sesión de este navegador</b><br>" + (ses.nombre||"") + "<br><span style='opacity:.8;'>Tel: " + (ses.usuario||ses.telefono||"") + " • " + (ses.tipo||"jugador") + "</span><br><span style='font-size:11px;opacity:.7;'>Cada navegador tiene su propia sesión, aunque repitan el mismo número.</span>";
    else el.innerHTML = "<b>👀 Visitante</b> (este navegador)<br><span style='font-size:12px;opacity:.8;'>Entra con Nombre + Teléfono para tener tu sesión en este navegador.</span>";
  }catch(_){}
}
document.addEventListener("DOMContentLoaded", function(){ setTimeout(v18_mostrarSesionEnMenu, 800); setTimeout(v18_mostrarSesionEnMenu, 2500); });

/* ---------- 3) MEMORIA COMPARTIDA: GitHub como única verdad ---------- */
var v18_versionLocal = 0;
var v18_ultimoPull = 0;
var v18_pushTimer = null;
var v18_pushEnCurso = false;

function v18_getVersion(d){
  try{ if(d && typeof d.__v18_version === "number") return d.__v18_version; if(d && d.__ultimoCambio) return new Date(d.__ultimoCambio).getTime(); }catch(_){}
  return 0;
}
function v18_construirDatosParaGuardar(){
  try{
    var d = null;
    if(typeof datos !== "undefined" && datos) d = datos;
    else if(window.baseDatos && window.baseDatos._cache) d = window.baseDatos._cache;
    if(!d) return null;
    // Clonar para no mutar el original con secretos
    var copia = JSON.parse(JSON.stringify(d));
    try{ delete copia.githubToken; delete copia.token; delete copia.sm_github_config; }catch(_){}
    // Asegurar que inscripciones y cuentas estén incluidas (son las que cambian entre navegadores)
    try{
      if(typeof obtenerInscripcionesGuardadas === "function") copia.inscripciones = obtenerInscripcionesGuardadas();
      if(typeof obtenerCuentasGuardadas === "function") copia.cuentas = obtenerCuentasGuardadas();
      if(typeof obtenerSolicitudesJugadores === "function") copia.solicitudes = obtenerSolicitudesJugadores();
      if(typeof torneos !== "undefined") copia.torneos = torneos;
    }catch(_){}
    v18_versionLocal = (v18_versionLocal || v18_getVersion(d) || 0) + 1;
    copia.__v18_version = v18_versionLocal;
    copia.__ultimoCambio = new Date().toISOString();
    copia.__ultimoCambioPor = v18_esOrg() ? "organizador" : (v18_getSesion() ? (v18_getSesion().nombre||"jugador") : "visitante");
    return copia;
  }catch(e){ LOG("construir", e); return null; }
}
async function v18_pushAGitHub(origen){
  if(v18_pushEnCurso) return false;
  try{
    var cfg = v18_getGhCfg();
    if(!cfg.owner || !cfg.repo || !cfg.token) { LOG("push: sin token, solo local"); return false; }
    var copia = v18_construirDatosParaGuardar();
    if(!copia || !Array.isArray(copia.torneos)) return false;
    v18_pushEnCurso = true;
    var apiUrl = "https://api.github.com/repos/" + cfg.owner + "/" + cfg.repo + "/contents/" + encodeURIComponent(cfg.path) + "?ref=" + encodeURIComponent(cfg.branch||"main");
    var sha = null;
    try{
      var getRes = await fetch(apiUrl, {headers:{Authorization:"Bearer "+cfg.token, Accept:"application/vnd.github+json"}});
      if(getRes.ok){ var gj = await getRes.json(); sha = gj.sha; }
    }catch(_){}
    var body = {message:"Caribe v18 auto-guardado - "+(origen||"cambio")+" - "+new Date().toISOString(), content: v18_b64(JSON.stringify(copia)), branch: cfg.branch||"main"};
    if(sha) body.sha = sha;
    var putRes = await fetch(apiUrl, {method:"PUT", headers:{Authorization:"Bearer "+cfg.token, Accept:"application/vnd.github+json", "Content-Type":"application/json"}, body: JSON.stringify(body)});
    v18_pushEnCurso = false;
    if(putRes.ok){ LOG("push OK a", cfg.path, "v", copia.__v18_version); v18_mostrarEstadoSync("✅ Guardado en GitHub: " + new Date().toLocaleTimeString()); return true; }
    else { LOG("push falló", putRes.status); v18_mostrarEstadoSync("⚠️ No se pudo guardar en GitHub ("+putRes.status+"). Quedó guardado local."); return false; }
  }catch(e){ v18_pushEnCurso = false; LOG("push error", e); return false; }
}
function v18_pedirPush(origen){
  try{
    if(v18_pushTimer) clearTimeout(v18_pushTimer);
    v18_pushTimer = setTimeout(function(){ v18_pushAGitHub(origen||"cambio"); }, 1500);
  }catch(_){}
}
function v18_mostrarEstadoSync(txt){
  try{
    var el = document.getElementById("v18-sync-estado");
    if(!el){
      var caja = document.getElementById("diagnosticoGitHub") || document.body;
      el = document.createElement("p"); el.id = "v18-sync-estado"; caja.appendChild(el);
    }
    el.textContent = txt;
  }catch(_){}
}
/* PULL: sondear caribe-datos.json cada 6s, si hay versión más nueva, aplicarla SIN tocar la sesión */
async function v18_pullDeGitHub(){
  try{
    var ahora = Date.now();
    if(ahora - v18_ultimoPull < 4000) return; // no sondear más de 1 vez cada 4s
    v18_ultimoPull = ahora;
    var url = "./caribe-datos.json?t=" + ahora;
    var r = await fetch(url, {cache:"no-store"});
    if(!r.ok) return;
    var remoto = await r.json();
    if(!remoto || !Array.isArray(remoto.torneos)) return;
    var vRem = v18_getVersion(remoto);
    var vLoc = 0;
    try{ if(typeof datos !== "undefined" && datos) vLoc = v18_getVersion(datos); }catch(_){}
    if(vLoc && vRem <= vLoc && vRem !== 0) return; // ya tenemos lo más nuevo
    if(!vLoc && JSON.stringify(remoto.torneos) === JSON.stringify(typeof torneos !== "undefined" ? torneos : [])) return;
    LOG("pull: remoto v", vRem, " local v", vLoc, " -> aplicar");
    // Aplicar remoto SIN tocar la sesión (sessionStorage)
    try{
      var sesAntes = null; try{ sesAntes = sessionStorage.getItem("sm_jugador"); }catch(_){}
      var orgAntes = null; try{ orgAntes = sessionStorage.getItem("sm_organizador"); }catch(_){}
      if(typeof normalizarDatosImportados === "function"){ var parsed = normalizarDatosImportados(remoto); datos = parsed; }
      else datos = remoto;
      torneos = datos.torneos || [];
      try{ if(typeof obtenerInscripcionesGuardadas === "function"){ /* inscripciones ya vienen en datos */ } }catch(_){}
      try{ if(typeof aplicarDatosEnPantalla === "function") aplicarDatosEnPantalla(); }catch(_){}
      try{ if(typeof renderizarTorneosActivosSiempre === "function") renderizarTorneosActivosSiempre(); }catch(_){}
      try{ if(typeof renderizarInscripciones === "function") renderizarInscripciones(); }catch(_){}
      try{ if(typeof renderizarMiEquipo === "function") renderizarMiEquipo(); }catch(_){}
      try{ if(window.baseDatos) await window.baseDatos.guardar(datos); }catch(_){}
      try{ if(sesAntes) sessionStorage.setItem("sm_jugador", sesAntes); if(orgAntes) sessionStorage.setItem("sm_organizador", orgAntes); }catch(_){}
      v18_versionLocal = vRem || v18_versionLocal;
      v18_mostrarEstadoSync("🔄 Sincronizado desde GitHub: " + new Date().toLocaleTimeString());
      // Si el jugador tenía una inscripción rechazada, avisarle que ya puede re-inscribirse
      try{
        var ses = v18_getSesion();
        if(ses){
          var lista = typeof obtenerInscripcionesGuardadas === "function" ? obtenerInscripcionesGuardadas() : [];
          var miRech = lista.find(function(i){ return v18_normTel(i.telefono||"") === v18_normTel(ses.usuario) && i.estado === "rechazada"; });
          if(miRech && !sessionStorage.getItem("v18_aviso_rechazo_"+miRech.id)){
            sessionStorage.setItem("v18_aviso_rechazo_"+miRech.id, "1");
            setTimeout(function(){ alert("❌ Tu inscripción de equipo '" + (miRech.equipo||"") + "' fue rechazada por el organizador. Ya puedes enviar otra inscripción de equipo."); }, 600);
          }
        }
      }catch(_){}
    }catch(e){ LOG("pull aplicar error", e); }
  }catch(_){}
}
document.addEventListener("DOMContentLoaded", function(){ setTimeout(v18_pullDeGitHub, 2000); setInterval(v18_pullDeGitHub, 6000); });
/* Envolver guardados locales para que también empujen a GitHub */
try{
  var _sm = window.SM_pedirAutoGuardar;
  if(typeof _sm === "function" && !_sm.__v18){
    var sm18 = function(){ try{ _sm.apply(this, arguments); }catch(_){} try{ v18_pedirPush(arguments && arguments[0] ? String(arguments[0]) : "cambio"); }catch(_){} };
    sm18.__v18 = true; window.SM_pedirAutoGuardar = sm18;
  } else if(typeof _sm !== "function"){ window.SM_pedirAutoGuardar = function(o){ v18_pedirPush(o); }; }
}catch(_){}
try{
  var _gb = window.guardarBaseDatos;
  if(typeof _gb === "function" && !_gb.__v18){
    var gb18 = async function(){ var r = await _gb.apply(this, arguments); try{ v18_pedirPush("guardar"); }catch(_){} return r; };
    gb18.__v18 = true; window.guardarBaseDatos = gb18; try{ eval("guardarBaseDatos = gb18"); }catch(_){}
  }
}catch(_){}
try{
  var _gil = window.guardarInscripcionesLocal;
  if(typeof _gil === "function" && !_gil.__v18){
    var gil18 = function(){ var r = _gil.apply(this, arguments); try{ v18_pedirPush("inscripciones"); }catch(_){} return r; };
    gil18.__v18 = true; window.guardarInscripcionesLocal = gil18; try{ eval("guardarInscripcionesLocal = gil18"); }catch(_){}
  }
}catch(_){}

/* ---------- 4) RECHAZO DEL ORGANIZADOR SÍ SE REFLEJA Y SÍ DEJA RE-INSCRIBIRSE ---------- */
/* La función original solo hacía: insc.estado="rechazada"; guardarInscripcionesLocal(); renderizar();
   Eso solo quedaba en el navegador del organizador. Ahora: */
function v18_rechazarInscripcion(id){
  try{
    if(!v18_esOrg()){ alert("Solo el organizador puede rechazar."); return; }
    var lista = typeof obtenerInscripcionesGuardadas === "function" ? obtenerInscripcionesGuardadas() : [];
    var insc = lista.find(function(i){ return String(i.id)===String(id); });
    if(!insc){ alert("No se encontró esa inscripción."); return; }
    insc.estado = "rechazada";
    insc.fechaRechazo = new Date().toISOString();
    insc.rechazadaPor = "organizador";
    // Limpiar cualquier cuenta de capitán que se haya creado por error para esa inscripción (si aún no tiene equipo)
    try{
      if(typeof obtenerCuentasGuardadas === "function" && typeof guardarCuentasLocal === "function"){
        var cuentas = obtenerCuentasGuardadas();
        var cambiada = false;
        cuentas.forEach(function(c){
          if(v18_normTel(c.usuario||"") === v18_normTel(insc.telefono||"") && String(c.torneoId||"") === String(insc.torneoId||"") && !c.equipoId){
            c.estado = "activo"; cambiada = true;
          }
        });
        if(cambiada) guardarCuentasLocal(cuentas);
      }
    }catch(_){}
    // Guardar local + empujar a GitHub AHORA (no esperar)
    try{ if(typeof guardarInscripcionesLocal === "function") guardarInscripcionesLocal(lista); }catch(_){}
    try{ if(typeof renderizarInscripciones === "function") renderizarInscripciones(); }catch(_){}
    v18_pedirPush("rechazo-inscripcion");
    // Forzar push inmediato también
    setTimeout(function(){ v18_pushAGitHub("rechazo-inscripcion"); }, 800);
    alert("❌ Inscripción de '" + (insc.equipo||"") + "' rechazada y sincronizada.\n\nEl jugador ya puede volver a enviar otra inscripción de equipo en su navegador (en unos segundos, cuando su navegador sondee GitHub).");
  }catch(e){ LOG("rechazar", e); alert("No se pudo rechazar. Intenta de nuevo."); }
}
/* Reemplazar rechazarInscripcion con la versión v18 (misma firma) */
try{
  var _origRech = window.rechazarInscripcion;
  window._v18_rechazarOriginal = _origRech;
  var rech18 = function(id){ return v18_rechazarInscripcion(id); };
  rech18.__v18 = true;
  window.rechazarInscripcion = rech18;
  try{ eval("rechazarInscripcion = rech18"); }catch(_){}
}catch(_){}
/* También rechazar solicitud de jugador libre: debe reflejarse igual */
try{
  var _origRechSol = window.rechazarSolicitudJugador;
  if(typeof _origRechSol === "function" && !_origRechSol.__v18){
    var rechSol18 = function(id){ var r = _origRechSol.apply(this, arguments); try{ v18_pedirPush("rechazo-solicitud"); setTimeout(function(){ v18_pushAGitHub("rechazo-solicitud"); }, 800); }catch(_){} return r; };
    rechSol18.__v18 = true; window.rechazarSolicitudJugador = rechSol18; try{ eval("rechazarSolicitudJugador = rechSol18"); }catch(_){}
  }
}catch(_){}

/* ---------- 5) FORM DE CONFIG GITHUB EN CARGAR DATOS ---------- */
function v18_inyectarFormGitHub(){
  try{
    var caja = document.getElementById("diagnosticoGitHub");
    if(!caja) return;
    if(document.getElementById("v18-gh-form")) return;
    var cfg = v18_getGhCfg();
    var div = document.createElement("div");
    div.id = "v18-gh-form";
    div.style.cssText = "margin-top:16px;background:#111;border:1px solid #333;border-radius:12px;padding:14px;";
    div.innerHTML =
      '<h4 style="margin:0 0 8px 0;">🔄 Memoria compartida v18 — cada cambio en todos los navegadores</h4>' +
      '<p style="margin:0 0 10px 0;font-size:13px;opacity:.9;">Tu página sondea <b>caribe-datos.json</b> cada 6 segundos. Si el organizador rechaza en su navegador, el jugador lo ve en el suyo y ya puede re-inscribirse. Cada navegador tiene su propia sesión (Nombre + Teléfono), pero los datos son los mismos para todos.</p>' +
      '<input id="v18-gh-owner" placeholder="GitHub usuario (ej. diegocouoh)" value="'+(cfg.owner||"diegocouoh")+'" style="width:100%;padding:10px;border-radius:8px;border:1px solid #444;background:#1c1c1c;color:#fff;margin-bottom:8px;box-sizing:border-box;" />' +
      '<input id="v18-gh-repo" placeholder="Repositorio (ej. caribe-sports)" value="'+(cfg.repo||"caribe-sports")+'" style="width:100%;padding:10px;border-radius:8px;border:1px solid #444;background:#1c1c1c;color:#fff;margin-bottom:8px;box-sizing:border-box;" />' +
      '<input id="v18-gh-token" type="password" placeholder="Token fino de GitHub (solo contents:write para este repo)" value="'+(cfg.token||"")+'" style="width:100%;padding:10px;border-radius:8px;border:1px solid #444;background:#1c1c1c;color:#fff;margin-bottom:10px;box-sizing:border-box;" />' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;"><button type="button" class="action-button success" onclick="window.v18_guardarCfgGitHub()">💾 Guardar config GitHub</button><button type="button" class="action-button" onclick="window.v18_probarGuardarGitHub()">⬆ Probar guardar ahora</button><button type="button" class="action-button" onclick="window.v18_forzarSincronizar()">🔄 Forzar sincronizar ahora</button></div>' +
      '<p id="v18-sync-estado" style="margin:10px 0 0 0;font-size:12px;opacity:.85;">' + (cfg.token ? "✅ Config guardada. La memoria compartida está activa." : "⚠️ Sin token, solo se guarda local en este navegador.") + '</p>';
    caja.parentNode.insertBefore(div, caja.nextSibling);
  }catch(_){}
}
window.v18_guardarCfgGitHub = function(){
  try{
    var owner = (document.getElementById("v18-gh-owner").value||"").trim();
    var repo = (document.getElementById("v18-gh-repo").value||"").trim();
    var token = (document.getElementById("v18-gh-token").value||"").trim();
    if(!owner || !repo || !token){ alert("Completa usuario, repo y token."); return; }
    var cfg = v18_getGhCfg(); cfg.owner=owner; cfg.repo=repo; cfg.token=token; cfg.path="caribe-datos.json"; cfg.branch=cfg.branch||"main";
    try{ localStorage.setItem("sm_github_config", JSON.stringify(cfg)); }catch(_){}
    alert("✅ Config GitHub guardada. A partir de ahora cada cambio se comparte en todos los navegadores.");
    var el = document.getElementById("v18-sync-estado"); if(el) el.textContent = "✅ Config guardada. La memoria compartida está activa.";
  }catch(_){}
};
window.v18_probarGuardarGitHub = function(){ v18_pushAGitHub("prueba manual").then(function(ok){ alert(ok ? "✅ Guardado en GitHub: caribe-datos.json" : "No se pudo guardar. Revisa usuario/repo/token."); }); };
window.v18_forzarSincronizar = function(){ v18_pullDeGitHub().then(function(){ alert("Sincronización forzada. Revisa si ya se reflejó el cambio del otro navegador."); }); };
document.addEventListener("DOMContentLoaded", function(){ setTimeout(v18_inyectarFormGitHub, 1000); setTimeout(v18_inyectarFormGitHub, 2500); });

/* ---------- 6) HEREDAR FIXES DE v17 (invitar + invitación con advertencia) ---------- */
/* Si v17-patch.js ya está cargado, no duplicar. Si no está, aplicar lo mínimo de invitación aquí */
try{
  if(!window.__v17_cargado){
    // Asegurar sección Invitar para capitán + organizador (igual que v17)
    var _rm = window.renderizarMiEquipo;
    if(typeof _rm === "function" && !_rm.__v18){
      var rm18 = function(){ var r = _rm.apply(this, arguments); try{ setTimeout(function(){
        var bloque = document.getElementById("bloqueMiEquipo"); if(!bloque) return;
        if(document.getElementById("seccionInvitacionCapitan")) return;
        var ses = v18_getSesion(); var esCap = !!(ses && ses.tipo==="capitan"); var esOrg = v18_esOrg();
        if(!esCap && !esOrg) return;
        var mi = null; try{ mi = typeof getMiEquipo === "function" ? getMiEquipo() : null; }catch(_){}
        var equipo = mi ? mi.equipo : null; var torneo = mi ? mi.torneo : null;
        if(!equipo && esOrg && typeof torneos !== "undefined" && torneos.length){
          for(var i=0;i<torneos.length;i++){ var t = torneos[i]; if(t && t.equipos && t.equipos.length){ torneo=t; equipo=t.equipos[0]; break; } }
        }
        if(!equipo || !torneo) return;
        var div = document.createElement("div"); div.id="seccionInvitacionCapitan"; div.className="form"; div.style.marginTop="16px";
        var base = (window.location.origin + window.location.pathname).replace(/index\.html$/,"");
        var enlace = base + "?invitacion=" + encodeURIComponent(JSON.stringify({equipoId:equipo.id, torneoId:torneo.id, equipoNombre:equipo.nombre, torneoNombre:torneo.nombre, capitan:(ses && ses.nombre)||"Capitán"}));
        div.innerHTML = '<h3 style="margin-top:0;">📲 Invitaciones — Enlace</h3><p class="subtitle" style="margin-top:0;">Comparte este enlace. Al abrirlo verá la advertencia y solo le pedirá nombre y teléfono.</p><div style="background:#111;padding:10px;border-radius:8px;word-break:break-all;font-size:12px;margin-bottom:10px;">'+enlace+'</div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button type="button" class="action-button success" data-capitan="1" onclick="navigator.clipboard.writeText(\''+enlace+'\').then(function(){alert(\'Enlace copiado.\');})">📋 Copiar enlace de invitación</button></div>';
        bloque.appendChild(div);
      }, 80); }catch(_){} return r; };
      rm18.__v18 = true; window.renderizarMiEquipo = rm18; try{ eval("renderizarMiEquipo = rm18"); }catch(_){}
    }
  }
}catch(_){}

LOG("v18 cargado: memoria compartida, pestañas ocultas siempre, rechazo sincronizado, sesión por navegador.");
})();
