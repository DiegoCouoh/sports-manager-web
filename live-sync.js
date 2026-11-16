// ============================================================
// SPORTS MANAGER WEB v6 - SIN BANNER, SIN BOTON EN VIVO, SIN TOKEN
// Por que v5 fallo:
//  - v5 solo subia por GitHub API y eso EXIGE un token en CADA navegador.
//    Si en el celular o en la PC no habia token, no subia nada y no avisaba.
//    Por eso "envio en celular y no aparece en PC y viceversa".
//  - v5 tenia live-datos.json con torneos [] y al fusionar podia borrar torneos.
//  - El banner "Cargando desde GitHub... Parte 1 y Parte 2" se quedaba pegado
//    porque el Service Worker viejo seguia sirviendo index.html viejo.
// Como funciona v6:
//  - MQTT publico (broker.emqx.io / hivemq) con mensaje RETENIDO.
//    No pide token, no pide configurar nada, no pide cuenta.
//    Tu celular y tu PC se suscriben al mismo tema:
//      sm/diegocouoh/sports-manager-web/v6/sync
//    Cuando uno cambia algo, publica el estado completo (sin fotos, para que pese poco).
//    El broker lo guarda (retain) y se lo entrega al otro en <1s,
//    incluso si el otro acaba de abrir la app.
//  - Fusion por UNION, nunca borra: si el remoto viene vacio, se conserva lo local.
//    Las fotos se conservan: el remoto viene sin imagen, se re-usa la imagen local.
//  - Inscripciones: "aprobada" siempre gana a "pendiente".
//  - GitHub queda como respaldo: si hay token, tambien sube a GitHub.
//    Si no hay token, MQTT igual sincroniza. No se necesita token.
//  - Sin banner, sin pill EN VIVO, sin boton gigante. Solo un puntito
//    en la barra inferior: verde = conectado, amarillo = conectando.
// ============================================================
(function(){
"use strict";
var MY_ID = 'sm-' + Math.random().toString(36).slice(2,9);
var LS_WA = 'sports_whats_organizador';
var LS_SUPA_URL = 'sm_live_supabase_url';
var LS_SUPA_KEY = 'sm_live_supabase_key';
var lastTick = 0, lastPushHash = '', pushTimer = null, pullEnCurso = false, pushEnCurso = false;
var mqttClient = null, mqttConectado = false, mqttIntentando = false, mqttBrokerIdx = 0;
var BROKERS = ['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt'];
var bc = null;
try{ if('BroadcastChannel' in window){ bc = new BroadcastChannel('sm-live-v6'); bc.onmessage = function(ev){ try{ if(ev.data && ev.data.type==='cambio' && ev.data.from!==MY_ID){ setTimeout(function(){ try{ publicarMQTT(true); }catch(e){} }, 300); } }catch(e){} }; } }catch(e){}
function limpiarNum(v){ return String(v||'').replace(/[^0-9]/g,''); }
function getOrgWA(){ try{ return limpiarNum(localStorage.getItem(LS_WA)||''); }catch(e){ return ''; } }
window.SM_hablarOrg = function(){ var w = getOrgWA(); if(!w){ alert('El organizador aún no configuró su WhatsApp.'); return; } window.open('https://wa.me/'+w, '_blank'); };
function getTopic(){
  try{
    var loc = window.location; var parts = (loc.pathname||'/').split('/').filter(Boolean);
    var repo = parts.length ? parts[0] : 'sports-manager-web';
    var owner = 'diegocouoh';
    try{ var host = loc.hostname||''; if(host.indexOf('.github.io')!==-1) owner = host.split('.')[0] || owner; }catch(e){}
    // Si estas en localhost/file, usa el mismo tema por defecto para que PC y celular coincidan
    return 'sm/' + owner + '/' + repo + '/v6/sync';
  }catch(e){ return 'sm/diegocouoh/sports-manager-web/v6/sync'; }
}
var TOPIC = getTopic();
function getGithubCfg(){ try{ if(typeof obtenerGitHubConfig==='function') return obtenerGitHubConfig()||{}; }catch(e){} try{ return JSON.parse(localStorage.getItem('sm_github_config')||'null')||{}; }catch(e){ return {}; } }
function getOwnerRepo(){
  var cfg = getGithubCfg(); var owner = cfg.owner||'', repo = cfg.repo||'';
  if(!owner || !repo){ try{ var loc = window.location; var parts = (loc.pathname||'/').split('/').filter(Boolean); if(parts.length) repo = repo || parts[0]; var host = loc.hostname||''; if(host.indexOf('.github.io')!==-1) owner = owner || host.split('.')[0]; }catch(e){} }
  if(!owner) owner='diegocouoh'; if(!repo) repo='sports-manager-web';
  return {owner:owner, repo:repo, branch:cfg.branch||'main', token:cfg.token||''};
}
function basesParaLeer(){ try{ if(typeof construirBasesCandidatas==='function'){ var b = construirBasesCandidatas(); if(b && b.length) return b; } }catch(e){} var o = getOwnerRepo(); return ['', 'https://'+o.owner+'.github.io/'+o.repo+'/', 'https://raw.githubusercontent.com/'+o.owner+'/'+o.repo+'/main/']; }
function b64PorPartes(str){ try{ if(typeof stringA_Base64PorPartes==='function') return stringA_Base64PorPartes(str); }catch(e){} var bin = unescape(encodeURIComponent(str)); var out=''; var PASO=0x8000; for(var i=0;i<bin.length;i+=PASO){ out += btoa(bin.slice(i,i+PASO)); } return out; }
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
// Fusion de torneos por UNION: nunca borra. Conserva imagenes locales.
function fusionarTorneos(local, remoto){
  var porId = {};
  (local||[]).forEach(function(t){ if(t && t.id) porId[String(t.id)] = t; });
  (remoto||[]).forEach(function(rt){
    if(!rt || !rt.id) return; var k = String(rt.id); var lt = porId[k];
    if(!lt){ porId[k] = rt; return; }
    // Existe en ambos: toma remoto como base, pero conserva imagenes locales y une equipos/partidos
    var merged = JSON.parse(JSON.stringify(rt));
    // Equipos: une por id/nombre, conserva imagen local si remoto viene sin imagen
    var eqLocalPorClave = {};
    (lt.equipos||[]).forEach(function(eq){ eqLocalPorClave[String(eq.id||eq.nombre||'')] = eq; eqLocalPorClave['n:'+String(eq.nombre||'').toLowerCase()] = eq; });
    var eqMerged = [];
    var vistosEq = {};
    (merged.equipos||[]).forEach(function(req){
      var clave = String(req.id||req.nombre||'');
      var localEq = eqLocalPorClave[clave] || eqLocalPorClave['n:'+String(req.nombre||'').toLowerCase()];
      if(localEq){
        if(!req.imagen && localEq.imagen) req.imagen = localEq.imagen;
        // Jugadores: conserva imagen local de cada jugador
        if(Array.isArray(req.jugadores) && Array.isArray(localEq.jugadores)){
          req.jugadores.forEach(function(rj, idx){
            var lj = localEq.jugadores.find(function(x){ return String(x.id||x.nombre||'')===String(rj.id||rj.nombre||''); });
            if(lj && !rj.imagen && lj.imagen) rj.imagen = lj.imagen;
          });
        }
      }
      eqMerged.push(req); vistosEq[clave]=true; vistosEq['n:'+String(req.nombre||'').toLowerCase()]=true;
    });
    (lt.equipos||[]).forEach(function(leq){
      var clave = String(leq.id||leq.nombre||'');
      if(!vistosEq[clave] && !vistosEq['n:'+String(leq.nombre||'').toLowerCase()]) eqMerged.push(leq);
    });
    merged.equipos = eqMerged;
    // Partidos: une por id, gana remoto si coincide (resultado nuevo)
    var parPorId = {};
    (lt.partidos||[]).forEach(function(p){ if(p && p.id) parPorId[String(p.id)] = p; });
    (merged.partidos||[]).forEach(function(p){ if(p && p.id) parPorId[String(p.id)] = p; });
    // Partidos sin id: une por equipos + jornada
    var sinIdLocal = (lt.partidos||[]).filter(function(p){ return !p.id; });
    var sinIdRemoto = (merged.partidos||[]).filter(function(p){ return !p.id; });
    var todos = Object.keys(parPorId).map(function(k){ return parPorId[k]; });
    sinIdLocal.forEach(function(p){
      var existe = sinIdRemoto.some(function(q){ return String(q.equipoLocal||'')===String(p.equipoLocal||'') && String(q.equipoVisitante||'')===String(p.equipoVisitante||''); });
      if(!existe) todos.push(p);
    });
    merged.partidos = todos;
    // Campos que no vienen en remoto ligero: conserva biblioteca local si remoto no trae
    if(!merged.bibliotecaImagenes && lt.bibliotecaImagenes) merged.bibliotecaImagenes = lt.bibliotecaImagenes;
    porId[k] = merged;
  });
  return Object.keys(porId).map(function(k){ return porId[k]; });
}
function torneosLigerosParaEnviar(torneosArr){
  // Quita imagenes base64 (lo que hacia que el mensaje pesara MB y se cortara)
  try{
    return (torneosArr||[]).map(function(t){
      var c = JSON.parse(JSON.stringify(t));
      if(Array.isArray(c.equipos)){
        c.equipos = c.equipos.map(function(eq){ var e = Object.assign({}, eq); e.imagen = ''; if(Array.isArray(e.jugadores)){ e.jugadores = e.jugadores.map(function(j){ var jj = Object.assign({}, j); jj.imagen=''; return jj; }); } return e; });
      }
      delete c.bibliotecaImagenes;
      return c;
    });
  }catch(e){ return torneosArr||[]; }
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
      // UNION, nunca reemplazar por vacio. Si remoto viene vacio y local tiene, se conserva local.
      var localT = []; try{ localT = (typeof torneos!=='undefined' && torneos) ? torneos : []; }catch(e){}
      if(torneosRemotos.length===0 && localT.length>0){
        // No hacer nada con torneos, solo inscripciones (ya hecho arriba)
      } else {
        var hashRemoto = JSON.stringify(torneosRemotos).length + '|' + torneosRemotos.map(function(t){ return (t.id||'')+':'+((t.equipos||[]).length)+':'+((t.partidos||[]).length); }).join(';');
        var hashLocal = ''; try{ hashLocal = JSON.stringify(localT).length + '|' + localT.map(function(t){ return (t.id||'')+':'+((t.equipos||[]).length)+':'+((t.partidos||[]).length); }).join(';'); }catch(e){}
        if(hashRemoto!==hashLocal){
          if(!tieneCambiosSinGuardar()){
            try{
              var fusionT = fusionarTorneos(localT, torneosRemotos);
              if(typeof datos!=='undefined' && datos) datos.torneos = fusionT;
              try{ torneos = fusionT; }catch(e){}
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
    }
  }catch(e){}
  if(cambio){ try{ if(typeof renderizarInscripciones==='function') renderizarInscripciones(); }catch(e){} }
  return cambio;
}
function actualizarPuntito(estado){
  try{
    var el = document.getElementById('sm-sync-dot-v6');
    if(!el) return;
    if(estado==='conectado'){ el.style.background='#22c55e'; el.title='Sincronización automática: conectado'; }
    else if(estado==='conectando'){ el.style.background='#f59e0b'; el.title='Sincronización automática: conectando...'; }
    else { el.style.background='#e5484d'; el.title='Sincronización automática: sin conexión, reintentando...'; }
    var txt = document.getElementById('sm-sync-txt-v6'); if(txt) txt.textContent = estado==='conectado' ? 'Sincronización automática ✓' : estado==='conectando' ? 'Conectando sincronización…' : 'Sincronización: reintentando…';
  }catch(e){}
}
function inyectarPuntito(){
  try{
    if(document.getElementById('sm-sync-dot-v6')) return;
    var barra = document.getElementById('barraInferior'); if(!barra) return;
    var span = document.createElement('span');
    span.id = 'sm-sync-wrap-v6';
    span.style.cssText = 'display:inline-flex;align-items:center;gap:6px;font-size:11px;opacity:.85;color:#e8e8e8;';
    span.innerHTML = '<span id="sm-sync-dot-v6" style="width:8px;height:8px;border-radius:50%;background:#f59e0b;display:inline-block;"></span><span id="sm-sync-txt-v6">Conectando sincronización…</span>';
    barra.appendChild(span);
  }catch(e){}
}
setTimeout(inyectarPuntito, 1000); setInterval(inyectarPuntito, 5000);
// --- MQTT ---
function cargarLibreriaMQTT(cb){
  if(window.mqtt){ cb(); return; }
  var urls = ['https://unpkg.com/mqtt@5.10.4/dist/mqtt.min.js','https://cdn.jsdelivr.net/npm/mqtt@5.10.4/dist/mqtt.min.js'];
  var i = 0;
  function probar(){
    if(i>=urls.length){ cb(); return; }
    var s = document.createElement('script'); s.src = urls[i++]; s.onload = function(){ cb(); }; s.onerror = function(){ probar(); }; document.head.appendChild(s);
  }
  probar();
}
function conectarMQTT(){
  if(mqttIntentando) return; mqttIntentando = true; actualizarPuntito('conectando');
  cargarLibreriaMQTT(function(){
    if(!window.mqtt){ mqttIntentando=false; actualizarPuntito('error'); return; }
    var url = BROKERS[mqttBrokerIdx % BROKERS.length];
    try{
      if(mqttClient){ try{ mqttClient.end(true); }catch(e){} }
      mqttClient = window.mqtt.connect(url, {clientId:'sm-v6-'+Math.random().toString(36).slice(2,9), clean:true, connectTimeout:6000, reconnectPeriod:0, keepalive:30});
      mqttClient.on('connect', function(){
        mqttConectado = true; mqttIntentando = false; actualizarPuntito('conectado');
        try{ mqttClient.subscribe(TOPIC, {qos:1}, function(){}); }catch(e){}
        // Al conectar, publica tu estado actual para que el otro lo vea si acaba de entrar
        setTimeout(function(){ try{ publicarMQTT(false); }catch(e){} }, 800);
      });
      mqttClient.on('message', function(topic, payload){
        try{
          var txt = payload.toString(); var j = JSON.parse(txt);
          if(!j || !j.tick) return;
          if(j.from===MY_ID){ if(j.tick>lastTick) lastTick=j.tick; return; }
          if(j.tick<=lastTick) return;
          aplicarRemotoEnLocal(j, {}); lastTick = j.tick;
        }catch(e){}
      });
      mqttClient.on('close', function(){ mqttConectado=false; mqttIntentando=false; actualizarPuntito('error'); setTimeout(function(){ mqttBrokerIdx++; conectarMQTT(); }, 3000); });
      mqttClient.on('error', function(){ try{ mqttClient.end(true); }catch(e){} mqttConectado=false; mqttIntentando=false; actualizarPuntito('error'); setTimeout(function(){ mqttBrokerIdx++; conectarMQTT(); }, 3000); });
    }catch(e){ mqttIntentando=false; actualizarPuntito('error'); setTimeout(function(){ mqttBrokerIdx++; conectarMQTT(); }, 3000); }
  });
}
function publicarMQTT(forzar){
  try{
    var torneosLocal = []; try{ torneosLocal = (typeof torneos!=='undefined' && torneos) ? torneos : []; }catch(e){}
    var inscLocal = []; try{ inscLocal = (typeof obtenerInscripcionesGuardadas==='function') ? obtenerInscripcionesGuardadas() : []; }catch(e){}
    // No publiques vacio si aun no cargaste nada: evita borrar lo del otro
    if(torneosLocal.length===0 && inscLocal.length===0 && lastTick===0 && !forzar) return false;
    if(!mqttClient || !mqttConectado) return false;
    var tick = Date.now();
    var payload = {tick: tick, updated_at: new Date().toISOString(), from: MY_ID, torneos: torneosLigerosParaEnviar(torneosLocal), inscripciones: inscLocal};
    var str = JSON.stringify(payload);
    if(str.length > 900000){
      // Si aun asi pesa mucho (muchos torneos), publica solo inscripciones + aviso. Los torneos se sincronizan por GitHub si hay token.
      payload = {tick: tick, updated_at: payload.updated_at, from: MY_ID, torneos: [], inscripciones: inscLocal, soloInscripciones: true, aviso: 'payload grande, solo inscripciones por MQTT'};
      str = JSON.stringify(payload);
    }
    mqttClient.publish(TOPIC, str, {qos:1, retain:true}, function(err){ if(!err){ lastTick = tick; lastPushHash = hashLigero(); try{ if(bc) bc.postMessage({type:'cambio', from:MY_ID, tick:tick}); }catch(e){} } });
    return true;
  }catch(e){ return false; }
}
function pedirAutoGuardar(origen){
  try{ if(pushTimer) clearTimeout(pushTimer); }catch(e){}
  pushTimer = setTimeout(function(){
    var ok = publicarMQTT(false);
    if(!ok){
      // Respaldo: si MQTT no esta conectado, intenta GitHub si hay token
      pushGitHub().catch(function(){});
    }
  }, 900);
}
window.SM_pedirAutoGuardar = pedirAutoGuardar;
// --- Respaldo GitHub (solo si hay token, no obligatorio) ---
async function leerJSONConBases(nombreArchivo){
  var bases = basesParaLeer();
  for(var i=0;i<bases.length;i++){ try{ var url = bases[i] + nombreArchivo + '?ts=' + Date.now(); var r = await fetch(url, {cache:'no-store'}); if(!r.ok) continue; var j = await r.json(); return j; }catch(e){} }
  return null;
}
async function pushGitHub(){
  if(pushEnCurso) return false; var o = getOwnerRepo(); if(!o.token) return false;
  var inscLocal = []; try{ inscLocal = (typeof obtenerInscripcionesGuardadas==='function') ? obtenerInscripcionesGuardadas() : []; }catch(e){}
  var torneosLocal = []; try{ torneosLocal = (typeof torneos!=='undefined' && torneos) ? torneos : []; }catch(e){}
  if(torneosLocal.length===0 && inscLocal.length===0) return false;
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
    lastTick = tick; lastPushHash = hashLigero(); return true;
  }catch(e){ return false; } finally{ pushEnCurso = false; }
}
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
setTimeout(conectarMQTT, 1200);
// Detector: cada 1s, si cambiaste algo, publica por MQTT
setInterval(function(){ try{ var h = hashLigero(); if(!h) return; if(lastPushHash===''){ lastPushHash = h; return; } if(h!==lastPushHash && !pullEnCurso){ lastPushHash = h; pedirAutoGuardar('detector'); } }catch(e){} }, 1000);
// Respaldo por GitHub cada 15s (solo si MQTT esta caido o hay token)
setInterval(function(){ if(!mqttConectado) pullSilencioso().catch(function(){}); }, 15000);
setTimeout(function(){ try{ lastPushHash = hashLigero(); }catch(e){} }, 2500);
// Supabase opcional (ya no obligatorio)
function getSupa(){ try{ return {url: localStorage.getItem(LS_SUPA_URL)||'', key: localStorage.getItem(LS_SUPA_KEY)||''}; }catch(e){ return {url:'', key:''}; } }
function inyectarPanelSync(){
  try{
    if(document.getElementById('sm-sync-panel-v6')) return;
    var respaldo = document.getElementById('respaldo') || document.querySelector('#respaldo'); if(!respaldo) return;
    var cfg = getGithubCfg();
    var div = document.createElement('div'); div.id = 'sm-sync-panel-v6'; div.className = 'form solo-organizador'; div.style.cssText = 'max-width:720px;margin-top:24px;';
    div.innerHTML = '<h3 style="margin-top:0;">Sincronización automática (sin configurar nada)</h3>'
      + '<p class="subtitle" style="margin-top:0;">Ya no necesitas token ni Supabase. La app se conecta sola por MQTT (tema: <b>'+TOPIC+'</b>) y se envía sola cada cambio en &lt;1s. GitHub queda solo como respaldo: <b>'+(cfg.token ? 'configurado ✓' : 'sin token — no importa, MQTT igual sincroniza')+'</b>.</p>'
      + '<div class="button-container" style="margin-bottom:0;"><button class="action-button success" type="button" id="smForzarSyncV6">Forzar sincronización ahora</button><button class="action-button" type="button" id="smReconectarV6">Reconectar</button></div>'
      + '<p class="subtitle" style="margin-top:10px;">Si en un dispositivo no llega nada: cierra la app por completo y vuelve a abrirla. Asegúrate de que los 2 dispositivos tengan esta versión v6 (el puntito de abajo debe decir "Sincronización automática ✓").</p>';
    respaldo.appendChild(div);
    var btnF = document.getElementById('smForzarSyncV6'); if(btnF) btnF.onclick = function(){ publicarMQTT(true); pullSilencioso().then(function(){ alert('Sincronización forzada. Si el otro dispositivo tenía algo nuevo, ya debe verse.'); }).catch(function(){ alert('Sincronización forzada.'); }); };
    var btnR = document.getElementById('smReconectarV6'); if(btnR) btnR.onclick = function(){ try{ if(mqttClient) mqttClient.end(true); }catch(e){} mqttConectado=false; mqttIntentando=false; mqttBrokerIdx++; conectarMQTT(); alert('Reconectando… Espera 3 segundos.'); };
  }catch(e){}
}
setTimeout(inyectarPanelSync, 3500); setInterval(inyectarPanelSync, 8000);
setTimeout(function(){ try{ if(typeof window.guardarBaseDatos==='function' && !window.guardarBaseDatos.__smV6){ var orig = window.guardarBaseDatos; var env = function(){ var r; try{ r = orig.apply(this, arguments); }catch(e){} try{ pedirAutoGuardar('guardarBaseDatos'); }catch(e){} return r; }; env.__smV6 = true; window.guardarBaseDatos = env; try{ if(typeof guardarBaseDatos!=='undefined') guardarBaseDatos = env; }catch(e){} } }catch(e){} }, 3000);
})();
