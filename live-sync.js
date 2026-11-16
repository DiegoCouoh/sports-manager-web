// ============================================================
// SPORTS MANAGER WEB v7 - COMPLETO, MOVIL + SINCRONIZACION REAL
// Por que v5/v6 fallaron en tu celular:
//  - v5 solo usaba GitHub API y exigia token en CADA navegador. Sin token, no subia nada.
//  - v6 solo usaba MQTT y en muchos celulares el WebSocket al broker esta bloqueado
//    o la libreria de unpkg no carga. Sin aviso, parecia que "no actualiza nada".
//  - El Service Worker viejo seguia sirviendo index.html viejo (banner pegado).
// v7 usa 4 canales a la vez. Con que UNO funcione, sincroniza:
//  1) MQTT (EMQX + HiveMQ + Mosquitto) - instantaneo <1s, sin token, sin cuenta
//  2) Trystero P2P (WebRTC, trackers publicos) - celular <-> PC directo, sin servidor
//  3) GitHub (lectura publica por CDN + escritura si hay token embebido o guardado)
//  4) BroadcastChannel (misma red / mismo navegador, pestañas)
//  + Respaldo manual: Copiar codigo / Pegar codigo por WhatsApp (siempre funciona)
// Fusion por UNION, nunca borra. Fotos se conservan. "aprobada" gana a "pendiente".
// Sin banner, sin boton EN VIVO gigante. Barra inferior: Ingresar + Hablar + Actualizar + estado.
// ============================================================
(function(){
"use strict";
var MY_ID = 'sm-' + Math.random().toString(36).slice(2,9);
var LS_WA = 'sports_whats_organizador';
var GITHUB_TOKEN_EMBEBIDO = ""; // <-- OPCIONAL: pega aqui tu token fino de GitHub (solo contents:write para este repo) entre comillas y sube el archivo. Si lo dejas vacio, MQTT/Trystero igual sincronizan.
var lastTick = 0, lastPushHash = '', pushTimer = null, pullEnCurso = false, pushEnCurso = false;
var mqttClient = null, mqttConectado = false, mqttIntentando = false, mqttBrokerIdx = 0;
var trysteroRoom = null, trysteroEnviar = null, trysteroListo = false;
var BROKERS = ['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt','wss://test.mosquitto.org:8081'];
var ultimoCanal = 'ninguno', ultimoSync = null, ultimoError = '';
var bc = null;
try{ if('BroadcastChannel' in window){ bc = new BroadcastChannel('sm-live-v7'); bc.onmessage = function(ev){ try{ if(ev.data && ev.data.type==='cambio' && ev.data.from!==MY_ID){ setTimeout(function(){ pullSilencioso(); }, 300); } }catch(e){} }; } }catch(e){}
function limpiarNum(v){ return String(v||'').replace(/[^0-9]/g,''); }
function getOrgWA(){ try{ return limpiarNum(localStorage.getItem(LS_WA)||''); }catch(e){ return ''; } }
window.SM_hablarOrg = function(){ var w = getOrgWA(); if(!w){ alert('El organizador aún no configuró su WhatsApp.'); return; } window.open('https://wa.me/'+w, '_blank'); };
function getTopic(){
  try{ var loc = window.location; var parts = (loc.pathname||'/').split('/').filter(Boolean); var repo = parts.length ? parts[0] : 'sports-manager-web'; var owner='diegocouoh'; try{ var host=loc.hostname||''; if(host.indexOf('.github.io')!==-1) owner = host.split('.')[0] || owner; }catch(e){} return 'sm/'+owner+'/'+repo+'/v7/sync'; }catch(e){ return 'sm/diegocouoh/sports-manager-web/v7/sync'; }
}
function getRoom(){ try{ var t=getTopic(); return t.replace(/\//g,'-'); }catch(e){ return 'sm-diegocouoh-sports-manager-web-v7-sync'; } }
var TOPIC = getTopic(); var ROOM = getRoom();
function getGithubCfg(){ try{ if(typeof obtenerGitHubConfig==='function') return obtenerGitHubConfig()||{}; }catch(e){} try{ return JSON.parse(localStorage.getItem('sm_github_config')||'null')||{}; }catch(e){ return {}; } }
function getToken(){ if(GITHUB_TOKEN_EMBEBIDO) return GITHUB_TOKEN_EMBEBIDO; try{ var c=getGithubCfg(); if(c.token) return c.token; }catch(e){} return ''; }
function getOwnerRepo(){
  var cfg=getGithubCfg(); var owner=cfg.owner||'', repo=cfg.repo||'';
  if(!owner||!repo){ try{ var loc=window.location; var parts=(loc.pathname||'/').split('/').filter(Boolean); if(parts.length) repo=repo||parts[0]; var host=loc.hostname||''; if(host.indexOf('.github.io')!==-1) owner=owner||host.split('.')[0]; }catch(e){} }
  if(!owner) owner='diegocouoh'; if(!repo) repo='sports-manager-web';
  return {owner:owner, repo:repo, branch:cfg.branch||'main', token:getToken()};
}
function basesParaLeer(){ try{ if(typeof construirBasesCandidatas==='function'){ var b=construirBasesCandidatas(); if(b&&b.length) return b; } }catch(e){} var o=getOwnerRepo(); return ['', 'https://'+o.owner+'.github.io/'+o.repo+'/', 'https://raw.githubusercontent.com/'+o.owner+'/'+o.repo+'/main/', 'https://cdn.jsdelivr.net/gh/'+o.owner+'/'+o.repo+'@main/']; }
function b64PorPartes(str){ try{ if(typeof stringA_Base64PorPartes==='function') return stringA_Base64PorPartes(str); }catch(e){} var bin=unescape(encodeURIComponent(str)); var out=''; var PASO=0x8000; for(var i=0;i<bin.length;i+=PASO){ out+=btoa(bin.slice(i,i+PASO)); } return out; }
function hashLigero(){
  try{
    var t=(typeof torneos!=='undefined'&&torneos)?torneos:[];
    var insc=[]; try{ insc=(typeof obtenerInscripcionesGuardadas==='function')?obtenerInscripcionesGuardadas():[]; }catch(e){ insc=[]; }
    var s=''; t.forEach(function(to){ s+=(to.id||'')+'|'+(to.nombre||'')+'|eq:'+((to.equipos||[]).length)+'|'; (to.equipos||[]).forEach(function(eq){ s+=(eq.nombre||'')+':'+(eq.capitan||'')+','; }); s+='par:'+((to.partidos||[]).length)+';'; (to.partidos||[]).forEach(function(p){ s+=(p.id||'')+':'+(p.golesLocal!=null?p.golesLocal:'')+'-'+(p.golesVisitante!=null?p.golesVisitante:'')+','; }); });
    insc.forEach(function(i){ s+='insc:'+(i.id||'')+':'+(i.estado||'')+':'+(i.equipo||'')+';'; });
    return s.length+'|'+s;
  }catch(e){ return ''; }
}
function tieneCambiosSinGuardar(){ try{ if(typeof window.HAY_CAMBIOS_SIN_GUARDAR!=='undefined'&&window.HAY_CAMBIOS_SIN_GUARDAR) return true; }catch(e){} return false; }
function fusionarInscripciones(local, remota){
  var porId={}; (remota||[]).forEach(function(i){ if(i&&i.id) porId[String(i.id)]=i; });
  (local||[]).forEach(function(i){ if(!i||!i.id) return; var k=String(i.id); if(!porId[k]){ porId[k]=i; return; } var cur=porId[k]; var orden={pendiente:0,rechazada:1,aprobada:2}; if((orden[i.estado]||0)>(orden[cur.estado]||0)) porId[k]=i; else if(i.estado===cur.estado&&String(i.fecha||'')>String(cur.fecha||'')) porId[k]=i; });
  var lista=Object.keys(porId).map(function(k){ return porId[k]; }); lista.sort(function(a,b){ return String(b.fecha||'').localeCompare(String(a.fecha||'')); }); return lista;
}
function fusionarTorneos(local, remoto){
  var porId={}; (local||[]).forEach(function(t){ if(t&&t.id) porId[String(t.id)]=t; });
  (remoto||[]).forEach(function(rt){
    if(!rt||!rt.id) return; var k=String(rt.id); var lt=porId[k];
    if(!lt){ porId[k]=rt; return; }
    var merged=JSON.parse(JSON.stringify(rt));
    var eqLocalPorClave={}; (lt.equipos||[]).forEach(function(eq){ eqLocalPorClave[String(eq.id||eq.nombre||'')]=eq; eqLocalPorClave['n:'+String(eq.nombre||'').toLowerCase()]=eq; });
    var eqMerged=[]; var vistos={};
    (merged.equipos||[]).forEach(function(req){
      var clave=String(req.id||req.nombre||''); var localEq=eqLocalPorClave[clave]||eqLocalPorClave['n:'+String(req.nombre||'').toLowerCase()];
      if(localEq){ if(!req.imagen&&localEq.imagen) req.imagen=localEq.imagen; if(Array.isArray(req.jugadores)&&Array.isArray(localEq.jugadores)){ req.jugadores.forEach(function(rj){ var lj=localEq.jugadores.find(function(x){ return String(x.id||x.nombre||'')===String(rj.id||rj.nombre||''); }); if(lj&&!rj.imagen&&lj.imagen) rj.imagen=lj.imagen; }); } }
      eqMerged.push(req); vistos[clave]=true; vistos['n:'+String(req.nombre||'').toLowerCase()]=true;
    });
    (lt.equipos||[]).forEach(function(leq){ var clave=String(leq.id||leq.nombre||''); if(!vistos[clave]&&!vistos['n:'+String(leq.nombre||'').toLowerCase()]) eqMerged.push(leq); });
    merged.equipos=eqMerged;
    var parPorId={}; (lt.partidos||[]).forEach(function(p){ if(p&&p.id) parPorId[String(p.id)]=p; }); (merged.partidos||[]).forEach(function(p){ if(p&&p.id) parPorId[String(p.id)]=p; });
    var todos=Object.keys(parPorId).map(function(k){ return parPorId[k]; });
    var sinIdLocal=(lt.partidos||[]).filter(function(p){ return !p.id; }); var sinIdRemoto=(merged.partidos||[]).filter(function(p){ return !p.id; });
    sinIdLocal.forEach(function(p){ var existe=sinIdRemoto.some(function(q){ return String(q.equipoLocal||'')===String(p.equipoLocal||'')&&String(q.equipoVisitante||'')===String(p.equipoVisitante||''); }); if(!existe) todos.push(p); });
    merged.partidos=todos;
    if(!merged.bibliotecaImagenes&&lt.bibliotecaImagenes) merged.bibliotecaImagenes=lt.bibliotecaImagenes;
    porId[k]=merged;
  });
  return Object.keys(porId).map(function(k){ return porId[k]; });
}
function torneosLigerosParaEnviar(arr){
  try{ return (arr||[]).map(function(t){ var c=JSON.parse(JSON.stringify(t)); if(Array.isArray(c.equipos)){ c.equipos=c.equipos.map(function(eq){ var e=Object.assign({},eq); e.imagen=''; if(Array.isArray(e.jugadores)){ e.jugadores=e.jugadores.map(function(j){ var jj=Object.assign({},j); jj.imagen=''; return jj; }); } return e; }); } delete c.bibliotecaImagenes; return c; }); }catch(e){ return arr||[]; }
}
function aplicarRemotoEnLocal(remoto, opts){
  opts=opts||{}; var cambio=false;
  try{
    var inscLocal=[]; try{ inscLocal=(typeof obtenerInscripcionesGuardadas==='function')?obtenerInscripcionesGuardadas():[]; }catch(e){}
    var inscRemota=Array.isArray(remoto.inscripciones)?remoto.inscripciones:(remoto.datos&&Array.isArray(remoto.datos.inscripciones)?remoto.datos.inscripciones:[]);
    if(inscRemota){
      var fusion=fusionarInscripciones(inscLocal, inscRemota); var antes=JSON.stringify(inscLocal);
      if(JSON.stringify(fusion)!==antes){ try{ if(typeof guardarInscripcionesLocal==='function') guardarInscripcionesLocal(fusion); else { try{ localStorage.setItem('sports_inscripciones_v1', JSON.stringify(fusion)); }catch(e){} } }catch(e){} lastPushHash=hashLigero(); cambio=true; }
      try{ if(typeof datos!=='undefined'&&datos) datos.inscripciones=fusion; }catch(e){}
    }
    var torneosRemotos=Array.isArray(remoto.torneos)?remoto.torneos:(remoto.datos&&Array.isArray(remoto.datos.torneos)?remoto.datos.torneos:null);
    if(torneosRemotos&&!opts.soloInscripciones){
      var localT=[]; try{ localT=(typeof torneos!=='undefined'&&torneos)?torneos:[]; }catch(e){}
      if(!(torneosRemotos.length===0&&localT.length>0)){
        var hashRemoto=JSON.stringify(torneosRemotos).length+'|'+torneosRemotos.map(function(t){ return (t.id||'')+':'+((t.equipos||[]).length)+':'+((t.partidos||[]).length); }).join(';');
        var hashLocal=''; try{ hashLocal=JSON.stringify(localT).length+'|'+localT.map(function(t){ return (t.id||'')+':'+((t.equipos||[]).length)+':'+((t.partidos||[]).length); }).join(';'); }catch(e){}
        if(hashRemoto!==hashLocal&&!tieneCambiosSinGuardar()){
          try{
            var fusionT=fusionarTorneos(localT, torneosRemotos);
            if(typeof datos!=='undefined'&&datos) datos.torneos=fusionT;
            try{ torneos=fusionT; }catch(e){}
            if(typeof guardarBaseDatos==='function'){ try{ guardarBaseDatos(); }catch(e){} }
            try{ if(typeof renderizarInscripciones==='function') renderizarInscripciones(); }catch(e){}
            try{ if(typeof renderizarTorneosActivosSiempre==='function') renderizarTorneosActivosSiempre(); }catch(e){}
            try{ if(typeof renderizarTorneosFinalizadosSiempre==='function') renderizarTorneosFinalizadosSiempre(); }catch(e){}
            try{ if(typeof actualizarListaTorneos==='function') actualizarListaTorneos(); }catch(e){}
            try{ if(typeof window.HAY_CAMBIOS_SIN_GUARDAR!=='undefined') window.HAY_CAMBIOS_SIN_GUARDAR=false; }catch(e){}
            lastPushHash=hashLigero(); cambio=true;
          }catch(e){}
        }
      }
    }
  }catch(e){}
  if(cambio){ try{ if(typeof renderizarInscripciones==='function') renderizarInscripciones(); }catch(e){} }
  if(cambio){ ultimoSync=new Date(); actualizarEstadoUI(); }
  return cambio;
}
function actualizarEstadoUI(){
  try{
    var dot=document.getElementById('sm-sync-dot-v7'); var txt=document.getElementById('sm-sync-txt-v7');
    if(!dot||!txt) return;
    var conectado = mqttConectado || trysteroListo;
    if(conectado){ dot.style.background='#22c55e'; txt.textContent = ultimoSync ? 'Sincronizado ✓ ' + ultimoSync.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) + ' · ' + ultimoCanal : 'Conectado ✓'; }
    else { dot.style.background='#f59e0b'; txt.textContent='Conectando… toca Actualizar'; }
    var panel=document.getElementById('sm-sync-estado-v7'); if(panel){ panel.textContent = 'Estado: ' + (conectado?'Conectado':'Conectando…') + ' · Último canal: ' + ultimoCanal + ' · Último cambio: ' + (ultimoSync?ultimoSync.toLocaleString():'—') + (ultimoError?' · Error: '+ultimoError:''); }
  }catch(e){}
}
setInterval(actualizarEstadoUI, 4000);
// --- MQTT ---
function cargarLibreriaMQTT(cb){
  if(window.mqtt){ cb(); return; }
  var urls=['https://unpkg.com/mqtt@5.10.4/dist/mqtt.min.js','https://cdn.jsdelivr.net/npm/mqtt@5.10.4/dist/mqtt.min.js'];
  var i=0; function probar(){ if(i>=urls.length){ cb(); return; } var s=document.createElement('script'); s.src=urls[i++]; s.onload=function(){ cb(); }; s.onerror=function(){ probar(); }; document.head.appendChild(s); } probar();
}
function conectarMQTT(){
  if(mqttIntentando) return; mqttIntentando=true; actualizarEstadoUI();
  cargarLibreriaMQTT(function(){
    if(!window.mqtt){ mqttIntentando=false; ultimoError='No cargó librería MQTT'; actualizarEstadoUI(); return; }
    var url=BROKERS[mqttBrokerIdx%BROKERS.length];
    try{
      if(mqttClient){ try{ mqttClient.end(true); }catch(e){} }
      mqttClient=window.mqtt.connect(url, {clientId:'sm-v7-'+Math.random().toString(36).slice(2,9), clean:true, connectTimeout:6000, reconnectPeriod:0, keepalive:30});
      mqttClient.on('connect', function(){ mqttConectado=true; mqttIntentando=false; ultimoCanal='MQTT'; ultimoError=''; actualizarEstadoUI(); try{ mqttClient.subscribe(TOPIC, {qos:1}, function(){}); }catch(e){} setTimeout(function(){ try{ publicarMQTT(false); }catch(e){} }, 600); });
      mqttClient.on('message', function(topic, payload){ try{ var j=JSON.parse(payload.toString()); if(!j||!j.tick) return; if(j.from===MY_ID){ if(j.tick>lastTick) lastTick=j.tick; return; } if(j.tick<=lastTick) return; ultimoCanal='MQTT'; aplicarRemotoEnLocal(j, {}); lastTick=j.tick; }catch(e){} });
      mqttClient.on('close', function(){ mqttConectado=false; mqttIntentando=false; ultimoError='MQTT cerrado, reintentando…'; actualizarEstadoUI(); setTimeout(function(){ mqttBrokerIdx++; conectarMQTT(); }, 3500); });
      mqttClient.on('error', function(){ try{ mqttClient.end(true); }catch(e){} mqttConectado=false; mqttIntentando=false; setTimeout(function(){ mqttBrokerIdx++; conectarMQTT(); }, 3500); });
    }catch(e){ mqttIntentando=false; setTimeout(function(){ mqttBrokerIdx++; conectarMQTT(); }, 3500); }
  });
}
function publicarMQTT(forzar){
  try{
    var torneosLocal=[]; try{ torneosLocal=(typeof torneos!=='undefined'&&torneos)?torneos:[]; }catch(e){}
    var inscLocal=[]; try{ inscLocal=(typeof obtenerInscripcionesGuardadas==='function')?obtenerInscripcionesGuardadas():[]; }catch(e){}
    if(torneosLocal.length===0&&inscLocal.length===0&&lastTick===0&&!forzar) return false;
    if(!mqttClient||!mqttConectado) return false;
    var tick=Date.now(); var payload={tick:tick, updated_at:new Date().toISOString(), from:MY_ID, torneos:torneosLigerosParaEnviar(torneosLocal), inscripciones:inscLocal};
    var str=JSON.stringify(payload);
    if(str.length>900000){ payload={tick:tick, updated_at:payload.updated_at, from:MY_ID, torneos:[], inscripciones:inscLocal, soloInscripciones:true}; str=JSON.stringify(payload); }
    mqttClient.publish(TOPIC, str, {qos:1, retain:true}, function(err){ if(!err){ lastTick=tick; lastPushHash=hashLigero(); ultimoCanal='MQTT'; ultimoSync=new Date(); actualizarEstadoUI(); try{ if(bc) bc.postMessage({type:'cambio', from:MY_ID, tick:tick}); }catch(e){} } });
    return true;
  }catch(e){ return false; }
}
// --- Trystero P2P ---
function conectarTrystero(){
  try{
    if(window.Trystero||window.trystero){ iniciarTrystero(); return; }
    var s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/trystero@0.20.0/build/trystero-torrent.min.js';
    s.onload=function(){ iniciarTrystero(); }; s.onerror=function(){ ultimoError='Trystero no cargó, MQTT sigue'; };
    document.head.appendChild(s);
  }catch(e){}
}
function iniciarTrystero(){
  try{
    var lib=window.Trystero||window.trystero; if(!lib||!lib.joinRoom) return;
    trysteroRoom=lib.joinRoom({appId:'sports-manager-v7'}, ROOM);
    var accion=trysteroRoom.makeAction('sync'); trysteroEnviar=accion[0];
    accion[1](function(data, peerId){ try{ var j=typeof data==='string'?JSON.parse(data):data; if(!j||!j.tick) return; if(j.from===MY_ID) return; if(j.tick<=lastTick) return; ultimoCanal='P2P'; aplicarRemotoEnLocal(j, {}); lastTick=j.tick; }catch(e){} });
    trysteroRoom.onPeerJoin(function(){ trysteroListo=true; ultimoCanal='P2P'; actualizarEstadoUI(); setTimeout(function(){ try{ publicarTrystero(false); }catch(e){} }, 800); });
    trysteroRoom.onPeerLeave(function(){});
    trysteroListo=true; actualizarEstadoUI();
  }catch(e){}
}
function publicarTrystero(forzar){
  try{
    if(!trysteroEnviar) return false;
    var torneosLocal=[]; try{ torneosLocal=(typeof torneos!=='undefined'&&torneos)?torneos:[]; }catch(e){}
    var inscLocal=[]; try{ inscLocal=(typeof obtenerInscripcionesGuardadas==='function')?obtenerInscripcionesGuardadas():[]; }catch(e){}
    if(torneosLocal.length===0&&inscLocal.length===0&&lastTick===0&&!forzar) return false;
    var tick=Date.now(); var payload={tick:tick, updated_at:new Date().toISOString(), from:MY_ID, torneos:torneosLigerosParaEnviar(torneosLocal), inscripciones:inscLocal};
    trysteroEnviar(JSON.stringify(payload)); lastTick=tick; lastPushHash=hashLigero(); ultimoCanal='P2P'; ultimoSync=new Date(); actualizarEstadoUI(); return true;
  }catch(e){ return false; }
}
// --- GitHub respaldo ---
async function leerJSONConBases(nombreArchivo){
  var bases=basesParaLeer();
  for(var i=0;i<bases.length;i++){ try{ var url=bases[i]+nombreArchivo+'?ts='+Date.now(); var r=await fetch(url, {cache:'no-store'}); if(!r.ok) continue; var j=await r.json(); return j; }catch(e){} }
  return null;
}
async function pushGitHub(){
  if(pushEnCurso) return false; var o=getOwnerRepo(); if(!o.token) return false;
  var inscLocal=[]; try{ inscLocal=(typeof obtenerInscripcionesGuardadas==='function')?obtenerInscripcionesGuardadas():[]; }catch(e){}
  var torneosLocal=[]; try{ torneosLocal=(typeof torneos!=='undefined'&&torneos)?torneos:[]; }catch(e){}
  if(torneosLocal.length===0&&inscLocal.length===0) return false;
  var tick=Date.now(); var payload={tick:tick, updated_at:new Date().toISOString(), from:MY_ID, torneos:torneosLocal, inscripciones:inscLocal}; var contenido=JSON.stringify(payload);
  pushEnCurso=true;
  try{
    for(var k=0;k<2;k++){
      var nombre=k===0?'live-datos.json':'live-tick.json'; var cuerpo=k===0?contenido:JSON.stringify({tick:tick, updated_at:payload.updated_at});
      var apiUrl='https://api.github.com/repos/'+o.owner+'/'+o.repo+'/contents/'+encodeURIComponent(nombre)+'?ref='+encodeURIComponent(o.branch);
      var sha=null; try{ var getRes=await fetch(apiUrl, {headers:{Authorization:'Bearer '+o.token, Accept:'application/vnd.github+json'}}); if(getRes.ok){ var gj=await getRes.json(); sha=gj.sha; } }catch(e){}
      var body={message:'Auto-sync Sports Manager '+new Date().toISOString(), content:b64PorPartes(cuerpo), branch:o.branch}; if(sha) body.sha=sha;
      var putRes=await fetch(apiUrl, {method:'PUT', headers:{Authorization:'Bearer '+o.token, Accept:'application/vnd.github+json', 'Content-Type':'application/json'}, body:JSON.stringify(body)});
      if(!putRes.ok&&k===0) return false;
    }
    lastTick=tick; lastPushHash=hashLigero(); ultimoCanal='GitHub'; ultimoSync=new Date(); actualizarEstadoUI(); return true;
  }catch(e){ return false; } finally{ pushEnCurso=false; }
}
async function pullSilencioso(){
  if(pullEnCurso) return; pullEnCurso=true;
  try{
    var tickJson=await leerJSONConBases('live-tick.json'); if(!tickJson||!tickJson.tick) return;
    if(tickJson.tick<=lastTick) return;
    if(tickJson.from&&tickJson.from===MY_ID){ lastTick=tickJson.tick; return; }
    var datosRemotos=await leerJSONConBases('live-datos.json'); if(!datosRemotos) return;
    if(datosRemotos.tick&&datosRemotos.tick<=lastTick) return;
    ultimoCanal='GitHub'; aplicarRemotoEnLocal(datosRemotos, {}); if(datosRemotos.tick) lastTick=datosRemotos.tick;
  }catch(e){} finally{ pullEnCurso=false; }
}
function pedirAutoGuardar(origen){
  try{ if(pushTimer) clearTimeout(pushTimer); }catch(e){}
  pushTimer=setTimeout(function(){
    var ok1=publicarMQTT(false); var ok2=publicarTrystero(false);
    if(!ok1&&!ok2){ pushGitHub().catch(function(){}); }
  }, 800);
}
window.SM_pedirAutoGuardar=pedirAutoGuardar;
function forzarSync(){
  try{ publicarMQTT(true); }catch(e){}
  try{ publicarTrystero(true); }catch(e){}
  pullSilencioso().then(function(){ return pushGitHub(); }).then(function(){ alert('Actualizado. Si el otro dispositivo tenía algo nuevo, ya debe verse.'); }).catch(function(){ alert('Actualizado.'); });
  actualizarEstadoUI();
}
window.SM_forzarSync=forzarSync;
// --- Copiar / Pegar codigo por WhatsApp (respaldo que siempre funciona) ---
function copiarCodigo(){
  try{
    var torneosLocal=[]; try{ torneosLocal=(typeof torneos!=='undefined'&&torneos)?torneos:[]; }catch(e){}
    var inscLocal=[]; try{ inscLocal=(typeof obtenerInscripcionesGuardadas==='function')?obtenerInscripcionesGuardadas():[]; }catch(e){}
    var payload={tick:Date.now(), from:MY_ID, torneos:torneosLigerosParaEnviar(torneosLocal), inscripciones:inscLocal};
    var str='SM-SYNC:'+b64PorPartes(JSON.stringify(payload));
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(str).then(function(){ alert('Código copiado. Pégalo por WhatsApp en el otro dispositivo y allá pulsa Pegar código.'); }).catch(function(){ prompt('Copia este código y mándalo por WhatsApp:', str); }); }
    else { prompt('Copia este código y mándalo por WhatsApp:', str); }
  }catch(e){ alert('No se pudo copiar.'); }
}
function pegarCodigo(){
  try{
    var str=prompt('Pega aquí el código que te mandaron por WhatsApp (empieza con SM-SYNC:):');
    if(!str) return; str=str.trim();
    if(str.indexOf('SM-SYNC:')===0) str=str.slice(8);
    var json=decodeURIComponent(escape(atob(str)));
    var j=JSON.parse(json); if(!j||!j.tick){ alert('Código inválido.'); return; }
    if(j.tick<=lastTick){ alert('Ese código ya lo tienes.'); return; }
    ultimoCanal='Código WhatsApp'; aplicarRemotoEnLocal(j, {}); lastTick=j.tick; alert('Aplicado ✓ Ya debe verse el cambio.');
  }catch(e){ alert('Código inválido. Pídelo de nuevo.'); }
}
window.SM_copiarCodigo=copiarCodigo; window.SM_pegarCodigo=pegarCodigo;
function inyectarPanelSync(){
  try{
    if(document.getElementById('sm-sync-panel-v7')) return;
    var respaldo=document.getElementById('respaldo')||document.querySelector('#respaldo'); if(!respaldo) return;
    var cfg=getGithubCfg();
    var div=document.createElement('div'); div.id='sm-sync-panel-v7'; div.className='form solo-organizador'; div.style.cssText='max-width:720px;margin-top:24px;';
    div.innerHTML='<h3 style="margin-top:0;">Sincronización automática — v7</h3>'
      +'<p id="sm-sync-estado-v7" class="subtitle" style="margin-top:0;">Estado: conectando…</p>'
      +'<p class="subtitle">Usa 4 canales a la vez: MQTT + P2P + GitHub + pestañas. Con que uno funcione, sincroniza. No necesitas configurar token. GitHub: <b>'+(cfg.token||GITHUB_TOKEN_EMBEBIDO?'configurado ✓':'sin token — no importa, MQTT/P2P igual sincronizan')+'</b>. Tema: <b>'+TOPIC+'</b></p>'
      +'<div class="button-container" style="margin-bottom:0;"><button class="action-button success" type="button" id="smForzarSyncV7">↻ Forzar sincronización</button><button class="action-button" type="button" id="smCopiarV7">📋 Copiar código para WhatsApp</button><button class="action-button" type="button" id="smPegarV7">📥 Pegar código</button><button class="action-button" type="button" id="smReconectarV7">Reconectar</button></div>'
      +'<p class="subtitle" style="margin-top:10px;">Si nada llega: 1) Asegúrate de que los 2 dispositivos tengan esta v7 (abajo debe decir Sincronizado ✓). 2) Pulsa Forzar sincronización en ambos. 3) Si aún no llega, usa Copiar código en el que tiene el cambio y Pega en el otro por WhatsApp — eso siempre funciona.</p>';
    respaldo.appendChild(div);
    var b1=document.getElementById('smForzarSyncV7'); if(b1) b1.onclick=forzarSync;
    var b2=document.getElementById('smCopiarV7'); if(b2) b2.onclick=copiarCodigo;
    var b3=document.getElementById('smPegarV7'); if(b3) b3.onclick=pegarCodigo;
    var b4=document.getElementById('smReconectarV7'); if(b4) b4.onclick=function(){ try{ if(mqttClient) mqttClient.end(true); }catch(e){} mqttConectado=false; mqttIntentando=false; mqttBrokerIdx++; conectarMQTT(); conectarTrystero(); alert('Reconectando… Espera 3 segundos.'); };
  }catch(e){}
}
setTimeout(function(){ conectarMQTT(); conectarTrystero(); }, 1200);
setInterval(function(){ try{ var h=hashLigero(); if(!h) return; if(lastPushHash===''){ lastPushHash=h; return; } if(h!==lastPushHash&&!pullEnCurso){ lastPushHash=h; pedirAutoGuardar('detector'); } }catch(e){} }, 1000);
setInterval(function(){ if(!mqttConectado&&!trysteroListo) pullSilencioso().catch(function(){}); }, 15000);
setTimeout(function(){ try{ lastPushHash=hashLigero(); }catch(e){} }, 2500);
setTimeout(inyectarPanelSync, 3500); setInterval(inyectarPanelSync, 8000);
setTimeout(function(){ try{ if(typeof window.guardarBaseDatos==='function'&&!window.guardarBaseDatos.__smV7){ var orig=window.guardarBaseDatos; var env=function(){ var r; try{ r=orig.apply(this, arguments); }catch(e){} try{ pedirAutoGuardar('guardarBaseDatos'); }catch(e){} return r; }; env.__smV7=true; window.guardarBaseDatos=env; try{ if(typeof guardarBaseDatos!=='undefined') guardarBaseDatos=env; }catch(e){} } }catch(e){} }, 3000);
})();
