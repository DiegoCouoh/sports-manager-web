// ============================================================
// SPORTS MANAGER WEB v4 - SIN APARTADO DE ROLES
// Regla nueva, simple y por ACCIONES (no por selector):
// - Todos son jugadores.
// - Quien envia la solicitud de inscripcion al torneo ES el Capitan.
//   Al aprobarla, tu app ya crea el equipo con capitan = quien la envio.
//   No hay que elegir nada, no hay panel de "Soy Organizador / Capitan / Jugador".
// - Organizador solo hay UNO: quien tiene la clave (Usuario + contrasena).
//   Es el unico que puede entrar con clave y modificar torneos en curso.
//   No hay otro organizador.
// - WhatsApp: cualquiera puede hablar con el Organizador con el boton verde.
//   No es un rol, es solo contacto.
//
// EN VIVO SEGUNDO A SEGUNDO, SIN COMPILAR NADA:
// - Modo GitHub 1s (ya incluido, sin configurar nada):
//   Cada 1 segundo revisa live-tick.json + version.json.
//   Cuando el Organizador pulsa "Guardar en GitHub", la app sube sola
//   live-tick.json con la hora actual. Los demas lo ven y recargan en silencio.
// - Modo Supabase instantaneo (gratis, opcional, sin tocar codigo):
//   Si el Organizador pega su URL + clave anonima de Supabase en
//   "Sincronizacion en vivo" (dentro de la app), el cambio llega en <1s
//   por Supabase Realtime, sin esperar a GitHub. Se configura dentro de
//   la app, no en el codigo. No hay que recompilar, ni reinstalar.
// - Si tienes cambios sin guardar, NO te los sobreescribe. Te avisa
//   "Hay cambios nuevos - Recargar" y tu decides cuando recargar.
// ============================================================
(function(){
"use strict";
var MY_ID = 'sm-' + Math.random().toString(36).slice(2,9);
var LS_ORG_WA = 'sports_whats_organizador';
var LS_SUPA_URL = 'sm_live_supabase_url';
var LS_SUPA_KEY = 'sm_live_supabase_key';
var lastTick = null, lastVersion = null, lastDataETag = null, lastDataMod = null;
var lastHash = '', lastSyncAt = Date.now(), syncing = false, supabaseClient = null, supabaseChannel = null, supabaseIntentado = false;
var bc = null;
try{ if ('BroadcastChannel' in window) { bc = new BroadcastChannel('sm-live-v4'); bc.onmessage = function(ev){ try{ if (ev.data && ev.data.type==='cambio' && ev.data.from!==MY_ID) pedirRecargaSilenciosa('otro dispositivo en la misma red/navegador'); }catch(e){} }; } }catch(e){}

function limpiarNum(v){ return String(v||'').replace(/[^0-9]/g,''); }
function getOrgWA(){ try{ return limpiarNum(localStorage.getItem(LS_ORG_WA)||''); }catch(e){ return ''; } }
function setOrgWA(v){ var c=limpiarNum(v); try{ localStorage.setItem(LS_ORG_WA, c); }catch(e){} var inp=document.getElementById('inscWhatsOrganizador'); if(inp) inp.value=c; try{ if(typeof renderizarInscripciones==='function') renderizarInscripciones(); }catch(e){} return c; }
function tieneCambiosSinGuardar(){
  try{ if (typeof window.HAY_CAMBIOS_SIN_GUARDAR !== 'undefined' && window.HAY_CAMBIOS_SIN_GUARDAR) return true; }catch(e){}
  try{ if (window.hayCambiosSinGuardar) return true; }catch(e){}
  try{ if (typeof window.ESTA_CARGANDO_DATOS !== 'undefined' && window.ESTA_CARGANDO_DATOS) return true; }catch(e){}
  return false;
}
function hashActual(){
  try{
    var t = (typeof torneos !== 'undefined' && torneos) ? torneos : [];
    var s = JSON.stringify(t).length + '|' + t.length;
    // hash barato de los primeros cambios: nombres + partidos
    var extra = '';
    t.forEach(function(to){ extra += (to.nombre||'') + ':' + ((to.equipos||[]).length) + ':' + ((to.partidos||[]).length) + ';'; });
    return s + '|' + extra.length + '|' + extra.slice(0,300);
  }catch(e){ return ''; }
}
function actualizarIndicador(estado){
  var pill = document.getElementById('sm-live-pill');
  if(!pill) return;
  var secs = Math.max(0, Math.floor((Date.now()-lastSyncAt)/1000));
  var dot = document.getElementById('sm-live-dot');
  var txt = document.getElementById('sm-live-txt');
  if (dot) dot.style.background = estado==='sin-guardar' ? '#f59e0b' : estado==='error' ? '#e5484d' : '#22c55e';
  if (txt) txt.textContent = estado==='sin-guardar' ? 'Tienes cambios sin guardar • No te sobreescribo' : ('EN VIVO • hace ' + secs + 's');
}
function mostrarBannerNuevo(motivo){
  var b = document.getElementById('sm-live-banner');
  if(!b){
    b = document.createElement('div'); b.id='sm-live-banner';
    b.style.cssText='position:fixed;left:12px;right:12px;bottom:76px;z-index:99999;background:#c9a227;color:#1a1400;border-radius:12px;padding:12px 14px;font-weight:800;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;box-shadow:0 10px 30px rgba(0,0,0,.4)';
    b.innerHTML='<span id="sm-live-banner-txt">🔄 Hay información nueva. Sin reinstalar nada.</span><span style="display:flex;gap:8px"><button id="sm-live-banner-reload" style="border:none;background:#101216;color:#fff;padding:10px 14px;border-radius:8px;font-weight:800;cursor:pointer;">Actualizar ahora</button><button id="sm-live-banner-cerrar" style="border:none;background:transparent;font-weight:800;cursor:pointer;">✕</button></span>';
    document.body.appendChild(b);
    document.getElementById('sm-live-banner-reload').onclick=function(){ ocultarBanner(); recargarSilenciosa(true); };
    document.getElementById('sm-live-banner-cerrar').onclick=function(){ ocultarBanner(); };
  }
  var tx=document.getElementById('sm-live-banner-txt');
  if(tx) tx.textContent='🔄 Hay información nueva ('+motivo+'). Pulsa Actualizar ahora. No tienes que reinstalar nada.';
  b.style.display='flex';
}
function ocultarBanner(){ var b=document.getElementById('sm-live-banner'); if(b) b.style.display='none'; }
function pedirRecargaSilenciosa(motivo){
  if (tieneCambiosSinGuardar()){ mostrarBannerNuevo(motivo); actualizarIndicador('sin-guardar'); return; }
  if (syncing) return;
  mostrarBannerNuevo(motivo);
  // En modo Supabase, recargar al instante. En modo GitHub, esperar 600ms por si vienen más cambios juntos.
  setTimeout(function(){ if(!tieneCambiosSinGuardar()) recargarSilenciosa(false); }, 600);
}
async function recargarSilenciosa(forzada){
  if (syncing && !forzada) return;
  syncing = true;
  try{
    if (typeof window.forzarRecargaDesdeGitHub === 'function'){
      var ok = await window.forzarRecargaDesdeGitHub(false);
      if (ok){ lastSyncAt=Date.now(); ocultarBanner(); syncing=false; return; }
    }
    if (typeof window.cargarDatosDesdeGitHub === 'function'){
      try{ await window.cargarDatosDesdeGitHub(true); lastSyncAt=Date.now(); ocultarBanner(); }catch(e){}
    }
  }catch(e){}
  syncing=false;
}
function emitirCambioLocal(){
  try{ if (bc) bc.postMessage({type:'cambio', from:MY_ID, at:Date.now()}); }catch(e){}
  try{ if (supabaseChannel) supabaseChannel.send({type:'broadcast', event:'cambio', payload:{from:MY_ID, at:Date.now()}}); }catch(e){}
  try{ localStorage.setItem('sm_live_last_local', String(Date.now())); }catch(e){}
}

// --- Supabase Realtime (opcional, gratis, sin tocar codigo) ---
function getSupa(){ try{ return {url:(localStorage.getItem(LS_SUPA_URL)||'').trim(), key:(localStorage.getItem(LS_SUPA_KEY)||'').trim()}; }catch(e){ return {url:'', key:''}; } }
async function conectarSupabase(){
  var cfg = getSupa();
  if(!cfg.url || !cfg.key) return false;
  if (supabaseIntentado && supabaseClient) return true;
  supabaseIntentado = true;
  try{
    if (!window.supabase){
      await new Promise(function(res, rej){
        var s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s);
      });
    }
    supabaseClient = window.supabase.createClient(cfg.url, cfg.key);
    supabaseChannel = supabaseClient.channel('sports-manager-live');
    supabaseChannel.on('broadcast', {event:'cambio'}, function(payload){
      try{ if (payload && payload.payload && payload.payload.from!==MY_ID) pedirRecargaSilenciosa('Supabase en vivo'); }catch(e){}
    });
    await supabaseChannel.subscribe();
    return true;
  }catch(e){ console.warn('Supabase no conectado, sigo en modo GitHub 1s', e); return false; }
}

// --- Auto-subir live-tick cuando el Organizador guarda en GitHub ---
async function subirLiveTick(){
  try{
    if (typeof window.obtenerGitHubConfig !== 'function') return;
    var cfg = window.obtenerGitHubConfig();
    if (!cfg || !cfg.owner || !cfg.repo || !cfg.token) return;
    var tick = Date.now();
    var contenido = JSON.stringify({tick: tick, version:'4.0.0', repo:'sports-manager-web', at: new Date(tick).toISOString(), nota:'Actualizado solo por la app al guardar en GitHub. Los demas lo revisan cada 1s.'});
    var apiUrl = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/live-tick.json?ref=' + encodeURIComponent(cfg.branch||'main');
    var sha = null;
    try{ var g = await fetch(apiUrl, {headers:{Authorization:'Bearer '+cfg.token, Accept:'application/vnd.github+json'}}); if(g.ok){ var gj=await g.json(); sha=gj.sha; } }catch(e){}
    var body = {message:'Live tick '+new Date(tick).toISOString(), content: btoa(unescape(encodeURIComponent(contenido))), branch: cfg.branch||'main'};
    if (sha) body.sha = sha;
    await fetch(apiUrl, {method:'PUT', headers:{Authorization:'Bearer '+cfg.token, Accept:'application/vnd.github+json','Content-Type':'application/json'}, body: JSON.stringify(body)});
    lastTick = tick;
  }catch(e){ /* Si falla, no pasa nada: sigo en modo polling de datos */ }
}
function envolverGuardarEnGitHub(){
  try{
    if (window.__smLiveEnvuelto) return; window.__smLiveEnvuelto = true;
    var orig = window.guardarEnGitHub;
    if (typeof orig !== 'function') return;
    window.guardarEnGitHub = async function(){
      var r = await orig.apply(this, arguments);
      try{ await subirLiveTick(); emitirCambioLocal(); }catch(e){}
      return r;
    };
  }catch(e){}
}

// --- Polling cada 1 segundo ---
async function tick1s(){
  actualizarIndicador(tieneCambiosSinGuardar() ? 'sin-guardar' : 'ok');
  // Detectar cambio LOCAL (yo edité algo) -> avisar a otras pestañas / Supabase
  var h = hashActual();
  if (h && lastHash && h!==lastHash && !syncing){
    // Si yo cambié, no recargo, solo emito
    emitirCambioLocal();
  }
  if (h) lastHash = h;
  if (document.hidden) return;
  if (tieneCambiosSinGuardar()) return;
  if (syncing) return;
  // 1) live-tick.json cada 1s (archivo diminuto)
  try{
    var r = await fetch('./live-tick.json?t='+Date.now(), {cache:'no-store'});
    if (r.ok){
      var j = await r.json();
      if (j && j.tick){
        if (lastTick===null) lastTick = j.tick;
        else if (j.tick!==lastTick){ lastTick=j.tick; pedirRecargaSilenciosa('el Organizador guardó en GitHub'); return; }
      }
    }
  }catch(e){}
}
async function tick5s(){
  if (document.hidden || tieneCambiosSinGuardar() || syncing) return;
  try{
    var r = await fetch('./version.json?t='+Date.now(), {cache:'no-store'});
    if (r.ok){ var j=await r.json(); if (j && j.version){ if (lastVersion===null) lastVersion=j.version; else if (j.version!==lastVersion){ lastVersion=j.version; pedirRecargaSilenciosa('nueva versión publicada'); } } }
  }catch(e){}
}
async function tick10s(){
  // Detectar subida manual de datos_parte1.json (cuando no se usa "Guardar en GitHub por API")
  if (document.hidden || tieneCambiosSinGuardar() || syncing) return;
  try{
    var r = await fetch('./datos_parte1.json?t='+Date.now(), {method:'HEAD', cache:'no-store'});
    if (r.ok){
      var et = r.headers.get('etag') || r.headers.get('ETag') || '';
      var lm = r.headers.get('last-modified') || '';
      if (lastDataETag===null){ lastDataETag=et; lastDataMod=lm; }
      else if ((et && et!==lastDataETag) || (lm && lm!==lastDataMod)){ lastDataETag=et; lastDataMod=lm; pedirRecargaSilenciosa('nuevos datos subidos a GitHub'); }
    }
  }catch(e){}
}

// --- UI: indicador + WhatsApp + ajustes (SIN roles) ---
function inyectarEstilos(){
  if (document.getElementById('sm-live-style')) return;
  var s=document.createElement('style'); s.id='sm-live-style';
  s.textContent='.sm-live-pill{position:fixed;top:12px;right:12px;z-index:99990;background:#171a20;border:1px solid #292d35;color:#e8e8e8;border-radius:999px;padding:8px 10px;display:flex;gap:8px;align-items:center;font-size:13px;box-shadow:0 8px 22px rgba(0,0,0,.35)} .sm-live-pill button{border:1px solid #343944;background:#252b35;color:#fff;border-radius:999px;padding:6px 10px;cursor:pointer;font-weight:700} .sm-live-dot{width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.25)} .sm-wa-fab{position:fixed;right:14px;bottom:14px;z-index:99990;background:#25D366;color:#fff;border:none;border-radius:999px;padding:13px 16px;font-weight:800;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.45);display:flex;gap:8px;align-items:center;font-size:14px} .sm-live-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99991;display:none;align-items:flex-start;justify-content:center;padding:18px;overflow:auto} .sm-live-overlay.open{display:flex} .sm-live-card{background:#171a20;border:1px solid #292d35;border-radius:16px;max-width:720px;width:100%;padding:18px;color:#e8e8e8} .sm-live-card label{font-size:13px;opacity:.9;display:block;margin:12px 0 4px} .sm-live-card input{width:100%;padding:11px 12px;border-radius:10px;border:1px solid #343944;background:#101216;color:#e8e8e8} .sm-live-btn{border:none;border-radius:10px;padding:11px 14px;font-weight:800;cursor:pointer} .sm-live-btn.gold{background:#c9a227;color:#1a1400} .sm-live-btn.green{background:#25D366;color:#fff} .sm-live-btn.dark{background:#252b35;color:#fff} .sm-live-muted{font-size:13px;opacity:.85;line-height:1.55} .sm-live-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}';
  document.head.appendChild(s);
}
function construirUI(){
  inyectarEstilos();
  if (!document.getElementById('sm-live-pill')){
    var pill=document.createElement('div'); pill.id='sm-live-pill'; pill.className='sm-live-pill';
    pill.innerHTML='<span id="sm-live-dot" class="sm-live-dot"></span><span id="sm-live-txt">EN VIVO • hace 0s</span><button id="sm-live-open">⚙️ Sincronización</button>';
    document.body.appendChild(pill);
    document.getElementById('sm-live-open').onclick=abrirAjustes;
  }
  if (!document.getElementById('sm-wa-fab')){
    var fab=document.createElement('button'); fab.id='sm-wa-fab'; fab.className='sm-wa-fab';
    fab.innerHTML='💬 Hablar con organizador';
    fab.onclick=function(){
      var org=getOrgWA();
      if(!org){ abrirAjustes(); alert('El Organizador aún no puso su WhatsApp. Si eres el Organizador, ponlo en Sincronización > WhatsApp del organizador.'); return; }
      window.open('https://wa.me/'+org+'?text='+encodeURIComponent('Hola, te escribo desde Sports Manager.'), '_blank');
    };
    document.body.appendChild(fab);
  }
  if (!document.getElementById('sm-live-overlay')){
    var ov=document.createElement('div'); ov.id='sm-live-overlay'; ov.className='sm-live-overlay';
    ov.innerHTML='<div class="sm-live-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><h2 style="margin:0">🔄 Sincronización en vivo</h2><button class="sm-live-btn dark" onclick="document.getElementById(\'sm-live-overlay\').classList.remove(\'open\')">✕ Cerrar</button></div><div id="sm-live-body"></div></div>';
    ov.addEventListener('click', function(e){ if(e.target===ov) ov.classList.remove('open'); });
    document.body.appendChild(ov);
  }
}
function abrirAjustes(){
  construirUI(); renderAjustes(); document.getElementById('sm-live-overlay').classList.add('open');
}
function renderAjustes(){
  var body=document.getElementById('sm-live-body'); if(!body) return;
  var cfg=getSupa(); var org=getOrgWA();
  var modo = (cfg.url && cfg.key) ? 'Supabase instantáneo (<1s)' : 'GitHub cada 1s (sin configurar nada)';
  body.innerHTML =
    '<p class="sm-live-muted">Esta app se instala como programa en línea y se actualiza sola estando conectada a WiFi / internet. <b>No hay que compilar nada, ni reinstalar, ni tocar el código.</b> Solo abre la app y se actualiza.<br><br><b>Cómo funciona ahora:</b><br>• Todos son jugadores.<br>• Quien envía la solicitud de inscripción al torneo <b>ES el Capitán</b> de ese equipo (al aprobarla, queda guardado así). No hay que elegirlo.<br>• Organizador solo hay <b>uno</b>: quien tiene la clave (Usuario + contraseña). Solo él puede modificar torneos en curso.<br><br>Modo actual: <b>'+modo+'</b></p>' +
    '<h3 style="margin:16px 0 4px">📱 WhatsApp del Organizador</h3><label>WhatsApp (código país + número, sin + ni espacios. Ej: 529981234567)</label><input id="sm-live-org-wa" type="tel" value="'+org+'" placeholder="Ej: 529981234567"><div class="sm-live-row"><button class="sm-live-btn gold" onclick="SM_LIVE_guardarWA()">Guardar WhatsApp</button><button class="sm-live-btn green" onclick="SM_LIVE_probarWA()">Probar: hablar con organizador</button></div>' +
    '<h3 style="margin:18px 0 4px">⚡ Modo instantáneo (opcional, gratis, sin compilar)</h3><p class="sm-live-muted">Si quieres que el cambio llegue en menos de 1 segundo aunque GitHub tarde, crea un proyecto gratis en Supabase y pega aquí su URL + clave anónima (nunca la secreta). Se guarda en este navegador, no en el código. Si lo dejas vacío, sigo en modo GitHub cada 1s.</p>' +
    '<label>Supabase URL (ej: https://xxxx.supabase.co)</label><input id="sm-live-supa-url" type="url" value="'+cfg.url.replace(/"/g,'&quot;')+'" placeholder="https://xxxx.supabase.co">' +
    '<label>Supabase Anon Key (clave pública, no la secreta)</label><input id="sm-live-supa-key" type="password" value="'+cfg.key.replace(/"/g,'&quot;')+'" placeholder="eyJ...">' +
    '<div class="sm-live-row"><button class="sm-live-btn gold" onclick="SM_LIVE_guardarSupa()">Guardar Supabase</button><button class="sm-live-btn dark" onclick="SM_LIVE_probarSupa()">Probar conexión</button><button class="sm-live-btn dark" onclick="SM_LIVE_borrarSupa()">Volver a modo GitHub 1s</button></div>' +
    '<h3 style="margin:18px 0 4px">🔄 Ahora mismo</h3><div class="sm-live-row"><button class="sm-live-btn gold" onclick="SM_LIVE_forzar()">↻ Recargar ahora desde GitHub</button></div><p class="sm-live-muted">Si eres el Organizador y acabas de cambiar algo, pulsa <b>Guardar en GitHub</b> en la sección Cargar datos. La app sube sola el “tick” y todos los celulares y PC conectados lo ven en 1 segundo.</p>';
}
window.SM_LIVE_guardarWA=function(){ var v=document.getElementById('sm-live-org-wa').value; var c=setOrgWA(v); alert(c?'WhatsApp del organizador guardado: '+c:'WhatsApp borrado.'); renderAjustes(); };
window.SM_LIVE_probarWA=function(){ var o=getOrgWA(); if(!o){ alert('Pon primero el WhatsApp del organizador.'); return; } window.open('https://wa.me/'+o+'?text='+encodeURIComponent('Hola, te escribo desde Sports Manager.'), '_blank'); };
window.SM_LIVE_guardarSupa=function(){ try{ localStorage.setItem(LS_SUPA_URL, (document.getElementById('sm-live-supa-url').value||'').trim()); localStorage.setItem(LS_SUPA_KEY, (document.getElementById('sm-live-supa-key').value||'').trim()); }catch(e){} supabaseIntentado=false; conectarSupabase().then(function(ok){ alert(ok?'Supabase conectado. Ahora los cambios llegan en menos de 1 segundo.':'Revisa URL y clave. Si no conecta, sigo en modo GitHub cada 1s.'); renderAjustes(); }); };
window.SM_LIVE_probarSupa=function(){ conectarSupabase().then(function(ok){ alert(ok?'Supabase conectado ✅':'No se pudo conectar. Revisa URL y clave, o déjalo vacío para usar modo GitHub cada 1s.'); }); };
window.SM_LIVE_borrarSupa=function(){ try{ localStorage.removeItem(LS_SUPA_URL); localStorage.removeItem(LS_SUPA_KEY); }catch(e){} try{ if(supabaseChannel) supabaseChannel.unsubscribe(); }catch(e){} supabaseClient=null; supabaseChannel=null; supabaseIntentado=false; alert('Listo. Vuelves a modo GitHub cada 1s, sin configurar nada.'); renderAjustes(); };
window.SM_LIVE_forzar=function(){ recargarSilenciosa(true); };
window.SM_LIVE_abrirAjustes=abrirAjustes;

document.addEventListener('DOMContentLoaded', function(){
  try{ construirUI(); }catch(e){}
  try{ envolverGuardarEnGitHub(); }catch(e){}
  // Reintentar envolver cuando la app termine de cargar (guardarEnGitHub se define después)
  setTimeout(function(){ try{ envolverGuardarEnGitHub(); }catch(e){} }, 2000);
  setTimeout(function(){ try{ envolverGuardarEnGitHub(); }catch(e){} }, 5000);
  try{ conectarSupabase(); }catch(e){}
  lastHash = hashActual();
});
document.addEventListener('visibilitychange', function(){ if(!document.hidden){ lastSyncAt=Date.now(); tick1s(); } });
window.addEventListener('storage', function(e){ if(e && e.key==='sm_live_last_local') pedirRecargaSilenciosa('otra pestaña'); });
setInterval(tick1s, 1000);
setInterval(tick5s, 5000);
setInterval(tick10s, 10000);
console.log('SM Web v4 en vivo cada 1s - SIN roles - Organizador unico con clave - Quien envia inscripcion es Capitan');
})();
