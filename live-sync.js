// ============================================================
// SPORTS MANAGER WEB v5 - SIN BOTON EN VIVO / SIN SINCRONIZACION GRANDE
// - No hay pill EN VIVO, no hay boton gigante de Sincronizacion, no hay FAB.
// - Barra inferior (en index.html): [Ingresar como organizador] [Hablar con organizador]
// - Sincronizacion AUTOMATICA en ambos sentidos, sin pulsar "Guardar en GitHub":
//   * Si envias una inscripcion en PC, llega sola al celular del organizador.
//   * Si el organizador la aprueba en el celular, el equipo nuevo aparece solo en la PC.
// - Como lo hace: cada 1s detecta si algo cambio en este dispositivo y lo sube solo
//   a GitHub (live-datos.json + live-tick.json). Cada 2s revisa si otro dispositivo
//   subio algo nuevo y lo baja y lo fusiona, sin borrar lo que tienes sin guardar.
// - Inscripciones: se fusionan por id. "aprobada" siempre gana a "pendiente".
// - Torneos: si tienes cambios sin guardar en este dispositivo, no te los sobreescribe.
// ============================================================
(function(){
"use strict";
var MY_ID = 'sm-' + Math.random().toString(36).slice(2,9);
var LS_WA = 'sports_whats_organizador';
var LS_SUPA_URL = 'sm_live_supabase_url';
var LS_SUPA_KEY = 'sm_live_supabase_key';
var lastTick = 0, lastPushHash = '', pushTimer = null, pullEnCurso = false, pushEnCurso = false, supabaseClient = null, supabaseChannel = null, supabaseIntentado = false;
var bc = null;
try{ if('BroadcastChannel' in window){ bc = new BroadcastChannel('sm-live-v5'); bc.onmessage = function(ev){ try{ if(ev.data && ev.data.type==='cambio' && ev.data.from!==MY_ID){ setTimeout(pullSilencioso, 300); } }catch(e){} }; } }catch(e){}
function limpiarNum(v){ return String(v||'').replace(/[^0-9]/g,''); }
function getOrgWA(){ try{ return limpiarNum(localStorage.getItem(LS_WA)||''); }catch(e){ return ''; } }
window.SM_hablarOrg = function(){ var w = getOrgWA(); if(!w){ alert('El organizador aún no configuró su WhatsApp.'); return; } window.open('https://wa.me/'+w, '_blank'); };
function getGithubCfg(){ try{ if(typeof obtenerGitHubConfig==='function') return obtenerGitHubConfig()||{}; }catch(e){} try{ return JSON.parse(localStorage.getItem('sm_github_config')||'null')||{}; }catch(e){ return {}; } }
function getOwnerRepo(){
  var cfg = getGithubCfg();
  var owner = cfg.owner || '', repo = cfg.repo || '';
  if(!owner || !repo){
    try{ var loc = window.location; var parts = (loc.pathname||'/').split('/').filter(Boolean); if(parts.length) repo = repo || parts[0]; var host = loc.hostname||''; if(host.indexOf('.github.io')!==-1) owner = owner || host.split('.')[0]; }catch(e){}
  }
  if(!owner) owner = 'diegocouoh'; if(!repo) repo = 'sports-manager-web';
  return {owner: owner, repo: repo, branch: cfg.branch||'main', token: cfg.token||''};
}
function basesParaLeer(){
  try{ if(typeof construirBasesCandidatas==='function'){ var b = construirBasesCandidatas(); if(b && b.length) return b; } }catch(e){}
  var o = getOwnerRepo(); return ['', 'https://'+o.owner+'.github.io/'+o.repo+'/', 'https://raw.githubusercontent.com/'+o.owner+'/'+o.repo+'/main/'];
}
function b64PorPartes(str){
  try{ if(typeof stringA_Base64PorPartes==='function') return stringA_Base64PorPartes(str); }catch(e){}
  var bin = unescape(encodeURIComponent(str)); var out=''; var PASO=0x8000; for(var i=0;i<bin.length;i+=PASO){ out += btoa(bin.slice(i,i+PASO)); } return out;
}
function hashLigero(){
  try{
    var t = (typeof torneos!=='undefined' && torneos) ? torneos : [];
    var insc = []; try{ insc = (typeof obtenerInscripcionesGuardadas==='function') ? obtenerInscripcionesGuardadas() : []; }catch(e){ insc=[]; }
    var s = '';
    t.forEach(function(to){ s += (to.id||'')+'|'+(to.nombre||'')+'|eq:'+((to.equipos||[]).length)+'|'; (to.equipos||[]).forEach(function(eq){ s += (eq.nombre||'')+':'+(eq.capitan||'')+','; }); s += 'par:'+((to.partidos||[]).length)+';'; (to.partidos||[]).forEach(function(p){ s += (p.id||'')+':'+(p.golesLocal!=null?p.golesLocal:'')+'-'+(p.golesVisitante!=null?p.golesVisitante:'')+','; }); });
    insc.forEach(function(i){ s += 'insc:'+(i.id||'')+':'+(i.estado||'')+':'+(i.equipo||'')+';'; });
    return s.length + '|' + s;
  }catch(e){ return ''; }
}
function tieneCambiosSinGuardar(){ try{ if(typeof window.HAY_CAMBIOS_SIN_GUARDAR!=='undefined' && window.HAY_CAMBIOS_SIN_GUARDAR) return true; }catch(e){} return false; }
function fusionarInscripciones(local, remota){
  var porId = {}; (remota||[]).forEach(function(i){ if(i && i.id) porId[String(i.id)] = i; });
  (local||[]).forEach(function(i){ if(!i || !i.id) return; var k = String(i.id); if(!porId[k]){ porId[k]=i; return; } var cur = porId[k]; var orden = {pendiente:0, rechazada:1, aprobada:2}; if((orden[i.estado]||0) > (orden[cur.estado]||0)) porId[k]=i; else if(i.estado===cur.estado && String(i.fecha||'') > String(cur.fecha||'')) porId[k]=i; });
  var lista = Object.keys(porId).map(function(k){ return porId[k]; }); lista.sort(function(a,b){ return String(b.fecha||'').localeCompare(String(a.fecha||'')); }); return lista;
}
function aplicarRemotoEnLocal(remoto, opts){
  opts = opts||{}; var cambio = false;
  try{
    var inscLocal = []; try{ inscLocal = (typeof obtenerInscripcionesGuardadas==='function') ? obtenerInscripcionesGuardadas() : []; }catch(e){}
    var inscRemota = Array.isArray(remoto.inscripciones) ? remoto.inscripciones : (remoto.datos && Array.isArray(remoto.datos.inscripciones) ? remoto.datos.inscripciones : []);
    if(inscRemota){
      var fusion = fusionarInscripciones(inscLocal, inscRemota); var antes = JSON.stringify(inscLocal);
      if(JSON.stringify(fusion)!==antes){
        try{ if(typeof guardarInscripcionesLocal==='function') guardarInscripcionesLocal(fusion); else { try{ localStorage.setItem('sports_inscripciones_v1', JSON.stringify(fusion)); }catch(e){} } }catch(e){}
        lastPushHash = hashLigero(); cambio = true;
      }
      try{ if(typeof datos!=='undefined' && datos) datos.inscripciones = fusion; }catch(e){}
    }
    var torneosRemotos = Array.isArray(remoto.torneos) ? remoto.torneos : (remoto.datos && Array.isArray(remoto.datos.torneos) ? remoto.datos.torneos : null);
    if(torneosRemotos && !opts.soloInscripciones){
      var hashRemoto = JSON.stringify(torneosRemotos).length + '|' + torneosRemotos.map(function(t){ return (t.id||'')+':'+((t.equipos||[]).length)+':'+((t.partidos||[]).length); }).join(';');
      var hashLocal = ''; try{ var tl = (typeof torneos!=='undefined' && torneos) ? torneos : []; hashLocal = JSON.stringify(tl).length + '|' + tl.map(function(t){ return (t.id||'')+':'+((t.equipos||[]).length)+':'+((t.partidos||[]).length); }).join(';'); }catch(e){}
      if(hashRemoto!==hashLocal){
        if(!tieneCambiosSinGuardar()){
          try{
            if(typeof datos!=='undefined' && datos) datos.torneos = torneosRemotos;
            try{ torneos = torneosRemotos; }catch(e){}
            if(typeof guardarBaseDatos==='function'){ try{ guardarBaseDatos(); }catch(e){} }
            try{ if(typeof renderizarInscripciones==='function') renderizarInscripciones(); }catch(e){}
            try{ if(typeof renderizarTorneosActivosSiempre==='function') renderizarTorneosActivosSiempre(); }catch(e){}
            try{ if(typeof renderizarTorneosFinalizadosSiempre==='function') renderizarTorneosFinalizadosSiempre(); }catch(e){}
            try{ if(typeof actualizarListaTorneos==='function') actualizarListaTorneos(); }catch(e){}
            try{ if(typeof window.HAY_CAMBIOS_SIN_GUARDAR!=='undefined') window.HAY_CAMBIOS_SIN_GUARDAR = false; }catch(e){}
            try{ if(typeof HAY_CAMBIOS_SIN_GUARDAR!=='undefined') HAY_CAMBIOS_SIN_GUARDAR = false; }catch(e){}
            lastPushHash = hashLigero(); cambio = true;
          }catch(e){}
        }
      }
    }
  }catch(e){}
  if(cambio){ try{ if(typeof renderizarInscripciones==='function') renderizarInscripciones(); }catch(e){} }
  return cambio;
}
async function leerJSONConBases(nombreArchivo){
  var bases = basesParaLeer();
  for(var i=0;i<bases.length;i++){ try{ var url = bases[i] + nombreArchivo + '?ts=' + Date.now(); var r = await fetch(url, {cache:'no-store'}); if(!r.ok) continue; var j = await r.json(); return j; }catch(e){} }
  return null;
}
async function pushGitHub(){
  if(pushEnCurso) return false;
  var o = getOwnerRepo(); if(!o.token) return false;
  var inscLocal = []; try{ inscLocal = (typeof obtenerInscripcionesGuardadas==='function') ? obtenerInscripcionesGuardadas() : []; }catch(e){}
  var torneosLocal = []; try{ torneosLocal = (typeof torneos!=='undefined' && torneos) ? torneos : []; }catch(e){}
  try{
    var remotoPrevio = await leerJSONConBases('live-datos.json');
    if(remotoPrevio && (Array.isArray(remotoPrevio.torneos) || Array.isArray(remotoPrevio.inscripciones))){
      if(remotoPrevio.tick && remotoPrevio.tick > lastTick){ aplicarRemotoEnLocal(remotoPrevio, {soloInscripciones: tieneCambiosSinGuardar()}); try{ inscLocal = (typeof obtenerInscripcionesGuardadas==='function') ? obtenerInscripcionesGuardadas() : inscLocal; }catch(e){} try{ torneosLocal = (typeof torneos!=='undefined' && torneos) ? torneosLocal : torneosLocal; }catch(e){} }
    }
  }catch(e){}
  var tick = Date.now(); var payload = {tick: tick, updated_at: new Date().toISOString(), from: MY_ID, torneos: torneosLocal, inscripciones: inscLocal}; var contenido = JSON.stringify(payload);
  pushEnCurso = true;
  try{
    for(var k=0;k<2;k++){
      var nombre = k===0 ? 'live-datos.json' : 'live-tick.json'; var cuerpo = k===0 ? contenido : JSON.stringify({tick: tick, updated_at: payload.updated_at});
      var apiUrl = 'https://api.github.com/repos/'+o.owner+'/'+o.repo+'/contents/'+encodeURIComponent(nombre)+'?ref='+encodeURIComponent(o.branch);
      var sha = null; try{ var getRes = await fetch(apiUrl, {headers:{Authorization:'Bearer '+o.token, Accept:'application/vnd.github+json'}}); if(getRes.ok){ var gj = await getRes.json(); sha = gj.sha; } }catch(e){}
      var body = {message:'Auto-sync Sports Manager '+new Date().toISOString(), content: b64PorPartes(cuerpo), branch: o.branch}; if(sha) body.sha = sha;
      var putRes = await fetch(apiUrl, {method:'PUT', headers:{Authorization:'Bearer '+o.token, Accept:'application/vnd.github+json', 'Content-Type':'application/json'}, body: JSON.stringify(body)});
      if(!putRes.ok && k===0) return false;
    }
    lastTick = tick; lastPushHash = hashLigero();
    try{ if(bc) bc.postMessage({type:'cambio', from: MY_ID, tick: tick}); }catch(e){}
    try{ if(supabaseChannel) supabaseChannel.send({type:'broadcast', event:'cambio', payload:{tick: tick, from: MY_ID}}); }catch(e){}
    return true;
  }catch(e){ return false; } finally{ pushEnCurso = false; }
}
function pedirAutoGuardar(origen){ try{ if(pushTimer) clearTimeout(pushTimer); }catch(e){} pushTimer = setTimeout(function(){ pushGitHub().catch(function(){}); }, 900); }
window.SM_pedirAutoGuardar = pedirAutoGuardar;
async function pullSilencioso(){
  if(pullEnCurso) return; pullEnCurso = true;
  try{
    var tickJson = await leerJSONConBases('live-tick.json'); if(!tickJson || !tickJson.tick) return;
    if(tickJson.tick <= lastTick) return;
    if(tickJson.from && tickJson.from===MY_ID){ lastTick = tickJson.tick; return; }
    var datosRemotos = await leerJSONConBases('live-datos.json'); if(!datosRemotos) return;
    if(datosRemotos.tick && datosRemotos.tick <= lastTick) return;
    aplicarRemotoEnLocal(datosRemotos, {}); if(datosRemotos.tick) lastTick = datosRemotos.tick;
  }catch(e){} finally{ pullEnCurso = false; }
}
setInterval(function(){ try{ var h = hashLigero(); if(!h) return; if(lastPushHash===''){ lastPushHash = h; return; } if(h!==lastPushHash && !pullEnCurso){ lastPushHash = h; pedirAutoGuardar('detector'); } }catch(e){} }, 1000);
setInterval(function(){ pullSilencioso().catch(function(){}); }, 2000);
setTimeout(function(){ try{ lastPushHash = hashLigero(); }catch(e){} pullSilencioso().catch(function(){}); }, 2500);
setTimeout(function(){ pullSilencioso().catch(function(){}); }, 6000);
function getSupa(){ try{ return {url: localStorage.getItem(LS_SUPA_URL)||'', key: localStorage.getItem(LS_SUPA_KEY)||''}; }catch(e){ return {url:'', key:''}; } }
function intentarSupabase(){
  if(supabaseIntentado) return; supabaseIntentado = true; var s = getSupa(); if(!s.url || !s.key) return;
  try{ var script = document.createElement('script'); script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; script.onload = function(){ try{ supabaseClient = window.supabase.createClient(s.url, s.key); supabaseChannel = supabaseClient.channel('sm-live-v5'); supabaseChannel.on('broadcast', {event:'cambio'}, function(msg){ try{ if(msg.payload && msg.payload.from!==MY_ID) pullSilencioso(); }catch(e){} }); supabaseChannel.subscribe(); }catch(e){} }; document.head.appendChild(script); }catch(e){}
}
setTimeout(intentarSupabase, 3000);
function inyectarPanelSync(){
  try{
    if(document.getElementById('sm-sync-panel-v5')) return;
    var respaldo = document.getElementById('respaldo') || document.querySelector('#respaldo'); if(!respaldo) return;
    var s = getSupa(); var cfg = getGithubCfg();
    var div = document.createElement('div'); div.id = 'sm-sync-panel-v5'; div.className = 'form solo-organizador'; div.style.cssText = 'max-width:720px;margin-top:24px;';
    div.innerHTML = '<h3 style="margin-top:0;">Sincronización automática (ya está activa)</h3>'
      + '<p class="subtitle" style="margin-top:0;">No tienes que pulsar Guardar. La app sube sola cada cambio y baja sola lo de otros dispositivos cada 2 segundos. GitHub: <b>'+(cfg.token ? 'configurado ✓' : 'sin token en este navegador — este dispositivo solo puede recibir, no enviar')+'</b>.</p>'
      + '<div class="form-group"><label>Supabase URL (opcional, para aviso en &lt;1s)</label><input type="text" id="smSupaUrlV5" placeholder="https://xyz.supabase.co" value="'+(s.url||'').replace(/"/g,'&quot;')+'"></div>'
      + '<div class="form-group"><label>Supabase anon public key (opcional, nunca la secreta)</label><input type="text" id="smSupaKeyV5" placeholder="anon public key" value="'+(s.key||'').replace(/"/g,'&quot;')+'"></div>'
      + '<div class="button-container" style="margin-bottom:0;"><button class="action-button success" type="button" id="smGuardarSupaV5">Guardar Supabase</button><button class="action-button" type="button" id="smForzarSyncV5">Forzar sincronización ahora</button></div>'
      + '<p class="subtitle" style="margin-top:10px;">Si no configuras Supabase, igual funciona por GitHub cada 2s. Supabase solo lo hace más rápido.</p>';
    respaldo.appendChild(div);
    var btnG = document.getElementById('smGuardarSupaV5'); if(btnG) btnG.onclick = function(){ try{ var u = (document.getElementById('smSupaUrlV5')||{}).value||''; var k = (document.getElementById('smSupaKeyV5')||{}).value||''; localStorage.setItem(LS_SUPA_URL, u.trim()); localStorage.setItem(LS_SUPA_KEY, k.trim()); alert('Supabase guardado. Recarga la página para activar el aviso instantáneo.'); }catch(e){ alert('No se pudo guardar.'); } };
    var btnF = document.getElementById('smForzarSyncV5'); if(btnF) btnF.onclick = function(){ pullSilencioso().then(function(){ return pushGitHub(); }).then(function(){ alert('Sincronización forzada. Si otro dispositivo tenía algo nuevo, ya debe verse.'); }).catch(function(){ alert('Sincronización forzada.'); }); };
  }catch(e){}
}
setTimeout(inyectarPanelSync, 3500); setInterval(inyectarPanelSync, 8000);
setTimeout(function(){ try{ if(typeof window.guardarBaseDatos==='function' && !window.guardarBaseDatos.__smV5){ var orig = window.guardarBaseDatos; var env = function(){ var r; try{ r = orig.apply(this, arguments); }catch(e){} try{ pedirAutoGuardar('guardarBaseDatos'); }catch(e){} return r; }; env.__smV5 = true; window.guardarBaseDatos = env; try{ if(typeof guardarBaseDatos!=='undefined') guardarBaseDatos = env; }catch(e){} } }catch(e){} }, 3000);
})();
