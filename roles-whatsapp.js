// ============================================================
// SPORTS MANAGER WEB - Roles + WhatsApp (MODULO AÑADIDO)
// No cambia tu app original. Solo AÑADE:
// - Boton flotante "Hablar con organizador por WhatsApp" para TODOS, sin restriccion
// - Roles: Organizador / Capitan / Jugador (agente libre)
// - Capitan: agregar/quitar jugadores SOLO si inscripciones abiertas, designar nuevo capitan (avisa por WhatsApp a nuevo capitan y a organizador)
// - Jugador: entrar como agente libre, hablar por WhatsApp con capitanes de equipos con menos de 14, aceptar/rechazar invitacion, salir del equipo
// Datos del organizador: reutiliza la clave que YA usa tu app: sports_whats_organizador
// Datos de roles: claves propias sm_roles_* para no tocar tus datos.
// ============================================================
(function(){
"use strict";
var LS_ORG_WA = 'sports_whats_organizador';
var LS_ROL = 'sm_roles_rol_v1';
var LS_MI_NOMBRE = 'sm_roles_mi_nombre_v1';
var LS_MI_WA = 'sm_roles_mi_wa_v1';
var LS_MI_EQUIPO = 'sm_roles_mi_equipo_v1';
var LS_FREE = 'sm_roles_free_agents_v1';
var LS_INV = 'sm_roles_invitaciones_v1';

function limpiarNum(v){ return String(v||'').replace(/[^0-9]/g,''); }
function getOrgWA(){ try{ return limpiarNum(localStorage.getItem(LS_ORG_WA)||''); }catch(e){ return ''; } }
function setOrgWA(v){ var c=limpiarNum(v); try{ localStorage.setItem(LS_ORG_WA, c); }catch(e){} var inp=document.getElementById('inscWhatsOrganizador'); if(inp) inp.value=c; try{ if(typeof renderizarInscripciones==='function') renderizarInscripciones(); }catch(e){} return c; }
function getRol(){ try{ return localStorage.getItem(LS_ROL)||'visitante'; }catch(e){ return 'visitante'; } }
function setRol(r){ try{ localStorage.setItem(LS_ROL, r); }catch(e){} refrescar(); }
function loadJSON(k, defv){ try{ var raw=localStorage.getItem(k); if(!raw) return defv; return JSON.parse(raw); }catch(e){ return defv; } }
function saveJSON(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function getTorneos(){ try{ if (typeof torneos !== 'undefined' && Array.isArray(torneos)) return torneos; }catch(e){} return []; }
function getEquiposDeTorneo(torneo){
  if(!torneo) return [];
  var arr = torneo.equipos || torneo.teams || [];
  return Array.isArray(arr) ? arr : [];
}
function contarJugadores(equipo){
  if(!equipo) return 0;
  var cands = [equipo.jugadores, equipo.plantel, equipo.jugadoresLista, equipo.integrantes, equipo.miembros];
  for (var i=0;i<cands.length;i++){ if(Array.isArray(cands[i])) return cands[i].length; }
  if (typeof equipo.numJugadores === 'number') return equipo.numJugadores;
  if (typeof equipo.cantidadJugadores === 'number') return equipo.cantidadJugadores;
  return 0;
}
function nombreEquipo(e){ return (e && (e.nombre || e.equipo || e.name)) || 'Equipo'; }
function capitanDe(e){
  if(!e) return {nombre:'', wa:''};
  return { nombre: e.capitan || e.capitanNombre || e.capitan_name || e.nombreCapitan || '', wa: limpiarNum(e.capitanWhatsApp || e.capitanTelefono || e.telefonoCapitan || e.whatsappCapitan || e.telefono || '') };
}
function waLink(num, texto){
  var n = limpiarNum(num);
  if(!n) return '';
  return 'https://wa.me/'+n+'?text='+encodeURIComponent(texto||'Hola, te escribo desde Sports Manager');
}
function abrirWA(num, texto){
  var link = waLink(num, texto);
  if(!link){ alert('Primero configura el WhatsApp. En el panel Roles y WhatsApp puedes poner el número del organizador / capitán.'); return; }
  window.open(link, '_blank');
}

function inyectarEstilos(){
  if (document.getElementById('smrw-style')) return;
  var s = document.createElement('style'); s.id='smrw-style';
  s.textContent = '.smrw-fab{position:fixed;right:14px;bottom:14px;z-index:99990;background:#25D366;color:#fff;border:none;border-radius:999px;padding:13px 16px;font-weight:800;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.45);display:flex;gap:8px;align-items:center;font-size:14px} .smrw-fab small{font-weight:400;opacity:.9} .smrw-pill{position:fixed;left:14px;bottom:14px;z-index:99990;background:#171a20;border:1px solid #292d35;color:#e8e8e8;border-radius:999px;padding:8px 10px;display:flex;gap:6px;align-items:center;font-size:13px;box-shadow:0 8px 22px rgba(0,0,0,.35);flex-wrap:wrap;max-width:calc(100vw - 190px)} .smrw-pill button{border:1px solid #343944;background:#1e222b;color:#e8e8e8;border-radius:999px;padding:7px 10px;cursor:pointer;font-weight:700} .smrw-pill button.act{background:#c9a227;color:#1a1400;border-color:#c9a227} .smrw-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99991;display:none;align-items:flex-start;justify-content:center;padding:18px;overflow:auto} .smrw-overlay.open{display:flex} .smrw-card{background:#171a20;border:1px solid #292d35;border-radius:16px;max-width:760px;width:100%;padding:18px;color:#e8e8e8} .smrw-card h2{margin:0 0 6px} .smrw-card h3{margin:18px 0 8px} .smrw-card label{font-size:13px;opacity:.9;display:block;margin:12px 0 4px} .smrw-card input,.smrw-card select,.smrw-card textarea{width:100%;padding:11px 12px;border-radius:10px;border:1px solid #343944;background:#101216;color:#e8e8e8} .smrw-card textarea{min-height:70px} .smrw-btn{border:none;border-radius:10px;padding:11px 14px;font-weight:800;cursor:pointer} .smrw-btn.gold{background:#c9a227;color:#1a1400} .smrw-btn.green{background:#25D366;color:#fff} .smrw-btn.dark{background:#252b35;color:#fff} .smrw-btn.red{background:#e5484d;color:#fff} .smrw-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px} .smrw-item{border:1px solid #292d35;border-radius:12px;padding:12px;margin-top:10px;background:#101216} .smrw-muted{font-size:13px;opacity:.85;line-height:1.55} .smrw-badge{display:inline-block;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:800} .smrw-badge.open{background:#1a7f4a;color:#fff} .smrw-badge.closed{background:#7f1a1a;color:#fff} @media(max-width:640px){.smrw-pill{max-width:calc(100vw - 28px);bottom:74px;left:14px}.smrw-fab{bottom:14px}}';
  document.head.appendChild(s);
}

function construirUI(){
  inyectarEstilos();
  if (!document.getElementById('smrw-fab')){
    var fab = document.createElement('button'); fab.id='smrw-fab'; fab.className='smrw-fab';
    fab.innerHTML = '💬 Hablar con organizador <small>WhatsApp</small>';
    fab.onclick = function(){
      var org = getOrgWA();
      if(!org){ abrirPanel(); alert('El organizador aún no puso su WhatsApp. Si eres el organizador, ponlo en Roles y WhatsApp > Organizador.'); return; }
      abrirWA(org, 'Hola, te escribo desde Sports Manager. Quiero hablar con el organizador.');
    };
    document.body.appendChild(fab);
  }
  if (!document.getElementById('smrw-pill')){
    var pill = document.createElement('div'); pill.id='smrw-pill'; pill.className='smrw-pill';
    pill.innerHTML = '<span style="opacity:.85">Soy:</span><button data-rol="organizador">👑 Organizador</button><button data-rol="capitan">🧢 Capitán</button><button data-rol="jugador">⚽ Jugador libre</button><button id="smrw-open" style="background:#c9a227;color:#1a1400;border-color:#c9a227">Roles y WhatsApp</button>';
    document.body.appendChild(pill);
    pill.querySelectorAll('button[data-rol]').forEach(function(b){ b.onclick=function(){ setRol(b.getAttribute('data-rol')); alert('Listo. Ahora entras como: '+b.textContent.trim()+'. Abre Roles y WhatsApp para ver lo que puedes hacer.'); }; });
    document.getElementById('smrw-open').onclick = abrirPanel;
  }
  if (!document.getElementById('smrw-overlay')){
    var ov = document.createElement('div'); ov.id='smrw-overlay'; ov.className='smrw-overlay';
    ov.innerHTML = '<div class="smrw-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><h2>👑🧢⚽ Roles y WhatsApp</h2><button class="smrw-btn dark" onclick="document.getElementById(\'smrw-overlay\').classList.remove(\'open\')">✕ Cerrar</button></div><p class="smrw-muted">Esto <b>no cambia</b> tu app original, solo añade lo que pediste. El botón verde de abajo es para que <b>cualquiera</b> hable con el organizador por WhatsApp, sin restricción.</p><div id="smrw-body"></div></div>';
    ov.addEventListener('click', function(e){ if(e.target===ov) ov.classList.remove('open'); });
    document.body.appendChild(ov);
  }
}

function abrirPanel(){ construirUI(); renderPanel(); document.getElementById('smrw-overlay').classList.add('open'); }
function refrescar(){
  var pill = document.getElementById('smrw-pill'); if(pill){ var rol=getRol(); pill.querySelectorAll('button[data-rol]').forEach(function(b){ b.classList.toggle('act', b.getAttribute('data-rol')===rol); }); }
  if (document.getElementById('smrw-overlay') && document.getElementById('smrw-overlay').classList.contains('open')) renderPanel();
}
window.SMRW_refrescar = refrescar;
window.SMRW_abrirPanel = abrirPanel;

function opcionesTorneos(){
  var ts = getTorneos();
  if(!ts.length) return '<p class="smrw-muted">Aún no hay torneos creados en esta app. Crea uno como Organizador en la sección principal y vuelve aquí.</p>';
  var html = '<label>Torneo</label><select id="smrw-torneo">';
  ts.forEach(function(t){ html += '<option value="'+t.id+'">'+(t.nombre||'Torneo')+' — '+(t.inscripcionesAbiertas===false?'🔴 Cerrado':'🟢 Abierto')+'</option>'; });
  html += '</select>';
  return html;
}
function torneoSeleccionado(){
  var sel = document.getElementById('smrw-torneo'); var ts=getTorneos();
  if(!sel || !ts.length) return null;
  return ts.find(function(t){ return String(t.id)===String(sel.value); }) || ts[0];
}
function renderPanel(){
  var body = document.getElementById('smrw-body'); if(!body) return;
  var rol = getRol(); var orgWA = getOrgWA();
  var miNombre = ''; try{ miNombre = localStorage.getItem(LS_MI_NOMBRE)||''; }catch(e){}
  var miWA = ''; try{ miWA = localStorage.getItem(LS_MI_WA)||''; }catch(e){}
  var miEquipo = ''; try{ miEquipo = localStorage.getItem(LS_MI_EQUIPO)||''; }catch(e){}
  var free = loadJSON(LS_FREE, []);
  var invs = loadJSON(LS_INV, []);
  var torneo = torneoSeleccionado();
  var equipos = torneo ? getEquiposDeTorneo(torneo) : [];
  var abiertas = torneo ? torneo.inscripcionesAbiertas !== false : false;

  var html = '';
  html += '<div class="smrw-row"><button class="smrw-btn dark" onclick="SMRW_setRol(\'organizador\')">👑 Soy Organizador</button><button class="smrw-btn dark" onclick="SMRW_setRol(\'capitan\')">🧢 Soy Capitán</button><button class="smrw-btn dark" onclick="SMRW_setRol(\'jugador\')">⚽ Soy Jugador libre</button></div>';
  html += '<p class="smrw-muted">Tu rol actual: <b>'+(rol==='organizador'?'👑 Organizador':rol==='capitan'?'🧢 Capitán':rol==='jugador'?'⚽ Jugador libre':'Visitante')+'</b> &nbsp;|&nbsp; WhatsApp organizador: <b>'+(orgWA||'— no configurado —')+'</b></p>';

  // --- ORGANIZADOR ---
  html += '<h3>👑 Organizador — invitar y configurar</h3>';
  html += '<label>Tu WhatsApp (código país + número, sin + ni espacios. Ej: 529981234567)</label><input id="smrw-org-wa" type="tel" placeholder="Ej: 529981234567" value="'+orgWA+'">';
  html += '<div class="smrw-row"><button class="smrw-btn gold" onclick="SMRW_guardarOrgWA()">Guardar WhatsApp del organizador</button><button class="smrw-btn green" onclick="SMRW_hablarOrg()">Probar: hablarme a mí por WhatsApp</button></div>';
  html += '<p class="smrw-muted">Este es el número que usa el botón verde “Hablar con organizador” para todos. También queda guardado en la misma clave que ya usa tu app (<i>sports_whats_organizador</i>), así que tu sección Inscripciones lo ve igual.</p>';
  html += '<label>Link público para invitar (compártelo por WhatsApp, Facebook, etc.)</label><input id="smrw-link" readonly value="'+(location.href.split('#')[0])+'">';
  html += '<div class="smrw-row"><button class="smrw-btn dark" onclick="SMRW_copiarLink()">📋 Copiar link</button><button class="smrw-btn green" onclick="SMRW_compartirWA()">📤 Compartir link por WhatsApp</button></div>';
  html += opcionesTorneos();
  if (torneo){
    html += '<p style="margin-top:10px">Inscripciones de este torneo: '+(abiertas?'<span class="smrw-badge open">🟢 ABIERTAS</span>':'<span class="smrw-badge closed">🔴 CERRADAS</span>')+' — Solo cuando están abiertas el Capitán puede agregar/quitar jugadores.</p>';
    html += '<div class="smrw-row"><button class="smrw-btn gold" onclick="SMRW_toggleInscripciones()">'+(abiertas?'🔴 Cerrar inscripciones':'🟢 Abrir inscripciones')+'</button></div>';
  }

  // --- CAPITAN ---
  html += '<h3>🧢 Capitán — mi equipo</h3>';
  html += '<p class="smrw-muted">Regla que pediste: el Capitán solo puede agregar / quitar jugadores cuando el torneo está con inscripciones <b>abiertas</b>. Si está cerrado, los botones se bloquean.</p>';
  html += '<label>Tu nombre (capitán)</label><input id="smrw-mi-nombre" value="'+miNombre.replace(/"/g,'&quot;')+'" placeholder="Tu nombre completo">';
  html += '<label>Tu WhatsApp</label><input id="smrw-mi-wa" type="tel" value="'+miWA+'" placeholder="Ej: 529981234567">';
  html += '<label>Mi equipo (escribe el nombre exacto como aparece en el torneo)</label><input id="smrw-mi-equipo" value="'+miEquipo.replace(/"/g,'&quot;')+'" placeholder="Ej: Halcones">';
  html += '<div class="smrw-row"><button class="smrw-btn gold" onclick="SMRW_guardarMisDatos()">Guardar mis datos de capitán</button></div>';
  if (torneo){
    html += '<div id="smrw-equipos-capitan" style="margin-top:12px">';
    equipos.forEach(function(eq){
      var n = nombreEquipo(eq); var cnt = contarJugadores(eq); var cap = capitanDe(eq);
      html += '<div class="smrw-item"><b>'+n+'</b> — '+cnt+'/14 jugadores &nbsp;|&nbsp; Capitán: '+(cap.nombre||'—')+'<br><span class="smrw-muted">¿Este es tu equipo? Escríbelo arriba en “Mi equipo” y vuelve aquí.</span>';
      html += '<div class="smrw-row"><button class="smrw-btn green" onclick="SMRW_hablarCapitan(\''+String(n).replace(/'/g,"\\'")+'\')">💬 Hablar con este capitán</button></div>';
      html += '<label>Agregar jugador (solo si inscripciones abiertas)</label><input id="smrw-add-'+String(eq.id||n).replace(/[^a-zA-Z0-9]/g,'')+'" placeholder="Nombre - Posición - WhatsApp">';
      html += '<div class="smrw-row"><button class="smrw-btn gold" '+(abiertas?'':'disabled style="opacity:.5"')+' onclick="SMRW_agregarJugador(\''+String(eq.id||'').replace(/'/g,"\\'")+'\',\''+String(n).replace(/'/g,"\\'")+'\')">➕ Agregar jugador</button><button class="smrw-btn red" '+(abiertas?'':'disabled style="opacity:.5"')+' onclick="SMRW_quitarUltimo(\''+String(eq.id||'').replace(/'/g,"\\'")+'\')">➖ Quitar último jugador</button></div>';
      html += '<label>Designar nuevo capitán (elige de la lista o escribe el nombre)</label><input id="smrw-newcap-'+String(eq.id||n).replace(/[^a-zA-Z0-9]/g,'')+'" placeholder="Nombre del nuevo capitán">';
      html += '<div class="smrw-row"><button class="smrw-btn dark" onclick="SMRW_designarCapitan(\''+String(eq.id||'').replace(/'/g,"\\'")+'\',\''+String(n).replace(/'/g,"\\'")+'\')">👑 Designar nuevo capitán + avisar por WhatsApp</button></div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // --- JUGADOR LIBRE ---
  html += '<h3>⚽ Jugador — entrar como agente libre</h3>';
  html += '<p class="smrw-muted">Como Jugador puedes entrar sin equipo, ver equipos con menos de 14 y hablarle al capitán por WhatsApp. Si te invitan, aceptas o rechazas. Si ya estás en un equipo, puedes salirte.</p>';
  html += '<label>Tu nombre</label><input id="smrw-jug-nombre" value="'+miNombre.replace(/"/g,'&quot;')+'" placeholder="Nombre completo">';
  html += '<label>Tu WhatsApp</label><input id="smrw-jug-wa" type="tel" value="'+miWA+'" placeholder="Ej: 529981234567">';
  html += '<label>Posición</label><select id="smrw-jug-pos"><option>Portero</option><option>Defensa</option><option>Mediocampista</option><option>Delantero</option><option>Sin posición</option></select>';
  html += '<label>Fecha de nacimiento (opcional)</label><input id="smrw-jug-nac" type="date">';
  html += '<label>Número de camiseta (opcional)</label><input id="smrw-jug-num" type="number" min="1" max="99" placeholder="Ej: 10">';
  html += '<div class="smrw-row"><button class="smrw-btn gold" onclick="SMRW_entrarLibre()">⚽ Entrar como agente libre</button><button class="smrw-btn red" onclick="SMRW_salirEquipo()">🚪 Salir de mi equipo</button></div>';
  html += '<p class="smrw-muted">Campos del jugador: nombre, WhatsApp, posición, fecha de nacimiento y número. Si después me pasas otros campos, se agregan aquí sin tocar lo demás.</p>';
  html += '<h3>Equipos con lugar (menos de 14) — habla con su capitán</h3>';
  if (!equipos.length) html += '<p class="smrw-muted">No hay equipos en este torneo todavía.</p>';
  equipos.forEach(function(eq){
    var cnt = contarJugadores(eq); if (cnt >= 14) return;
    var cap = capitanDe(eq);
    html += '<div class="smrw-item"><b>'+nombreEquipo(eq)+'</b> — '+cnt+'/14 jugadores — Capitán: '+(cap.nombre||'—')+'<div class="smrw-row"><button class="smrw-btn green" onclick="SMRW_pedirLugar(\''+String(nombreEquipo(eq)).replace(/'/g,"\\'")+'\',\''+String(cap.wa).replace(/'/g,"\\'")+'\',\''+String(cap.nombre).replace(/'/g,"\\'")+'\')">💬 Pedir lugar por WhatsApp al capitán</button></div></div>';
  });

  // --- AGENTES LIBRES + INVITACIONES ---
  html += '<h3>📥 Agentes libres e invitaciones</h3>';
  if (!free.length) html += '<p class="smrw-muted">Aún no hay agentes libres registrados en este navegador.</p>';
  free.forEach(function(f, idx){
    html += '<div class="smrw-item"><b>'+(f.nombre||'')+'</b> — '+(f.posicion||'')+' — WhatsApp: '+(f.wa||'—')+'<div class="smrw-row"><button class="smrw-btn green" onclick="SMRW_invitarAgente('+idx+')">📩 Invitar a mi equipo por WhatsApp</button></div></div>';
  });
  html += '<p class="smrw-muted" style="margin-top:12px"><b>Mis invitaciones</b></p>';
  if (!invs.length) html += '<p class="smrw-muted">No tienes invitaciones pendientes en este navegador.</p>';
  invs.forEach(function(inv, idx){
    html += '<div class="smrw-item"><b>'+(inv.equipo||'')+'</b> te invita. Capitán: '+(inv.capitan||'')+' — Torneo: '+(inv.torneo||'')+' — Estado: <b>'+(inv.estado||'pendiente')+'</b><div class="smrw-row"><button class="smrw-btn green" onclick="SMRW_responderInv('+idx+',\'aceptada\')">✅ Aceptar</button><button class="smrw-btn red" onclick="SMRW_responderInv('+idx+',\'rechazada\')">❌ Rechazar</button></div></div>';
  });
  body.innerHTML = html;
  var sel = document.getElementById('smrw-torneo'); if (sel){ sel.onchange = renderPanel; }
}

// --- Acciones globales ---
window.SMRW_setRol = function(r){ setRol(r); };
window.SMRW_guardarOrgWA = function(){
  var v = document.getElementById('smrw-org-wa').value;
  var c = setOrgWA(v);
  alert(c ? 'WhatsApp del organizador guardado: '+c : 'WhatsApp borrado.');
  refrescar();
};
window.SMRW_hablarOrg = function(){ var o=getOrgWA(); if(!o){ alert('Pon primero el WhatsApp del organizador.'); return; } abrirWA(o, 'Hola, te escribo desde Sports Manager.'); };
window.SMRW_copiarLink = function(){
  var inp=document.getElementById('smrw-link'); if(inp){ inp.select(); try{ document.execCommand('copy'); }catch(e){} try{ navigator.clipboard.writeText(inp.value); }catch(e){} alert('Link copiado. Compártelo donde quieras.'); }
};
window.SMRW_compartirWA = function(){ var link = location.href.split('#')[0]; window.open('https://wa.me/?text='+encodeURIComponent('Te invito a Sports Manager ⚽ Entra aquí: '+link), '_blank'); };
window.SMRW_toggleInscripciones = function(){
  var t = torneoSeleccionado(); if(!t){ alert('No hay torneo.'); return; }
  try{ t.inscripcionesAbiertas = !(t.inscripcionesAbiertas !== false); if (typeof guardarDatos==='function') guardarDatos(); else if (typeof guardarTorneos==='function') guardarTorneos(); }catch(e){}
  alert('Inscripciones ahora: '+(t.inscripcionesAbiertas?'🟢 ABIERTAS':'🔴 CERRADAS'));
  refrescar();
};
window.SMRW_guardarMisDatos = function(){
  try{
    localStorage.setItem(LS_MI_NOMBRE, document.getElementById('smrw-mi-nombre').value.trim());
    localStorage.setItem(LS_MI_WA, limpiarNum(document.getElementById('smrw-mi-wa').value));
    localStorage.setItem(LS_MI_EQUIPO, document.getElementById('smrw-mi-equipo').value.trim());
  }catch(e){}
  alert('Datos de capitán guardados en este navegador.');
  refrescar();
};
function equipoPorId(id, nombre){
  var ts=getTorneos(); for(var i=0;i<ts.length;i++){ var eqs=getEquiposDeTorneo(ts[i]); for(var j=0;j<eqs.length;j++){ if (String(eqs[j].id)===String(id) || nombreEquipo(eqs[j])===nombre) return {torneo:ts[i], equipo:eqs[j]}; } } return null;
}
window.SMRW_agregarJugador = function(id, nombre){
  var t = torneoSeleccionado(); if(!t){ alert('Elige un torneo.'); return; }
  if (t.inscripcionesAbiertas===false){ alert('Inscripciones CERRADAS. Solo el Organizador puede abrirlas. El Capitán no puede agregar jugadores ahora.'); return; }
  var found = equipoPorId(id, nombre); if(!found){ alert('Equipo no encontrado.'); return; }
  var eq = found.equipo;
  if (contarJugadores(eq) >= 14){ alert('Este equipo ya tiene 14 jugadores.'); return; }
  var key = 'smrw-add-'+String(id||nombre).replace(/[^a-zA-Z0-9]/g,'');
  var val = (document.getElementById(key)||{}).value || '';
  if(!val.trim()){ alert('Escribe: Nombre - Posición - WhatsApp'); return; }
  var partes = val.split('-'); var nuevo = {id: Date.now(), nombre: (partes[0]||'').trim()||val, posicion: (partes[1]||'').trim(), whatsapp: limpiarNum(partes[2]||''), telefono: limpiarNum(partes[2]||'')};
  try{
    if (Array.isArray(eq.jugadores)) eq.jugadores.push(nuevo);
    else if (Array.isArray(eq.plantel)) eq.plantel.push(nuevo);
    else eq.jugadores = [nuevo];
    if (typeof guardarDatos==='function') guardarDatos();
    else if (typeof guardarTorneos==='function') guardarTorneos();
  }catch(e){}
  // Respaldo propio por si la estructura original usa otro campo
  var backup = loadJSON('sm_roles_plantel_extra_v1', {}); var k = String(found.torneo.id)+'|'+nombreEquipo(eq); backup[k]=backup[k]||[]; backup[k].push(nuevo); saveJSON('sm_roles_plantel_extra_v1', backup);
  alert('Jugador agregado a '+nombreEquipo(eq)+' (inscripciones abiertas).');
  refrescar();
};
window.SMRW_quitarUltimo = function(id, nombre){
  var t = torneoSeleccionado(); if(!t){ alert('Elige un torneo.'); return; }
  if (t.inscripcionesAbiertas===false){ alert('Inscripciones CERRADAS. El Capitán no puede quitar jugadores ahora.'); return; }
  var found = equipoPorId(id, nombre); if(!found){ alert('Equipo no encontrado.'); return; }
  var eq = found.equipo;
  try{
    if (Array.isArray(eq.jugadores) && eq.jugadores.length) eq.jugadores.pop();
    else if (Array.isArray(eq.plantel) && eq.plantel.length) eq.plantel.pop();
    if (typeof guardarDatos==='function') guardarDatos();
  }catch(e){}
  alert('Último jugador quitado de '+nombreEquipo(eq)+'.');
  refrescar();
};
window.SMRW_designarCapitan = function(id, nombre){
  var found = equipoPorId(id, nombre); if(!found){ alert('Equipo no encontrado.'); return; }
  var key = 'smrw-newcap-'+String(id||nombre).replace(/[^a-zA-Z0-9]/g,'');
  var nuevo = ((document.getElementById(key)||{}).value||'').trim();
  if(!nuevo){ alert('Escribe el nombre del nuevo capitán.'); return; }
  var anterior = capitanDe(found.equipo);
  try{
    found.equipo.capitan = nuevo; found.equipo.capitanNombre = nuevo;
    if (typeof guardarDatos==='function') guardarDatos();
  }catch(e){}
  var org = getOrgWA();
  var msg = 'Hola '+nuevo+', el Capitán de '+nombreEquipo(found.equipo)+' te designó como nuevo Capitán en Sports Manager. El Capitán anterior era '+(anterior.nombre||'—')+'. Entra a la app para ver tu equipo.';
  // Avisar al nuevo capitán: si no tenemos su WhatsApp, abrir WhatsApp al organizador con el mensaje listo para reenviar
  if (org) abrirWA(org, 'AVISO PARA NUEVO CAPITÁN: '+msg+' (Por favor reenvíale esto a '+nuevo+')');
  else alert(msg);
  alert('Nuevo capitán designado: '+nuevo+'. Se avisó al organizador por WhatsApp para que lo reenvíe al nuevo capitán. También puedes copiar el mensaje y mandarlo tú.');
  refrescar();
};
window.SMRW_hablarCapitan = function(nombre){
  var found = equipoPorId('', nombre); var cap = found ? capitanDe(found.equipo) : {nombre:'', wa:''};
  if (cap.wa) abrirWA(cap.wa, 'Hola '+(cap.nombre||'')+', te escribo desde Sports Manager por el equipo '+nombre+'.');
  else alert('Este equipo aún no tiene WhatsApp de capitán guardado. Pídele al capitán que lo ponga en Roles y WhatsApp > Capitán.');
};
window.SMRW_pedirLugar = function(equipoNombre, capWA, capNombre){
  var miNombre=''; try{ miNombre=localStorage.getItem(LS_MI_NOMBRE)||''; }catch(e){}
  var miWA=''; try{ miWA=localStorage.getItem(LS_MI_WA)||''; }catch(e){}
  if (!capWA){ alert('Ese capitán aún no tiene WhatsApp guardado.'); return; }
  abrirWA(capWA, 'Hola '+(capNombre||'')+', soy '+(miNombre||'un jugador')+' y quiero un lugar en '+equipoNombre+' en Sports Manager. Mi WhatsApp es '+(miWA||'—')+'. ¿Me aceptas?');
};
window.SMRW_entrarLibre = function(){
  var nombre = (document.getElementById('smrw-jug-nombre')||{}).value || '';
  var wa = limpiarNum((document.getElementById('smrw-jug-wa')||{}).value || '');
  var pos = (document.getElementById('smrw-jug-pos')||{}).value || '';
  var nac = (document.getElementById('smrw-jug-nac')||{}).value || '';
  var num = (document.getElementById('smrw-jug-num')||{}).value || '';
  if(!nombre.trim()){ alert('Escribe tu nombre.'); return; }
  try{ localStorage.setItem(LS_MI_NOMBRE, nombre.trim()); localStorage.setItem(LS_MI_WA, wa); localStorage.setItem(LS_MI_EQUIPO, ''); }catch(e){}
  var free = loadJSON(LS_FREE, []); free = free.filter(function(f){ return (f.nombre||'').toLowerCase() !== nombre.trim().toLowerCase(); });
  free.push({nombre: nombre.trim(), wa: wa, posicion: pos, nacimiento: nac, numero: num, fecha: new Date().toISOString()});
  saveJSON(LS_FREE, free);
  alert('Entraste como agente libre: '+nombre.trim()+'. Los capitanes con lugar te pueden ver y escribirte.');
  refrescar();
};
window.SMRW_salirEquipo = function(){
  var miEquipo=''; try{ miEquipo=localStorage.getItem(LS_MI_EQUIPO)||''; }catch(e){}
  if(!miEquipo){ alert('No estás en ningún equipo en este navegador.'); return; }
  if(!confirm('¿Salir del equipo '+miEquipo+'?')) return;
  try{ localStorage.setItem(LS_MI_EQUIPO, ''); }catch(e){}
  var free = loadJSON(LS_FREE, []); // vuelve a agente libre si tenía nombre
  alert('Saliste del equipo '+miEquipo+'. Ahora quedas como agente libre.');
  refrescar();
};
window.SMRW_invitarAgente = function(idx){
  var free = loadJSON(LS_FREE, []); var f = free[idx]; if(!f){ alert('Agente no encontrado.'); return; }
  var miEquipo=''; try{ miEquipo=localStorage.getItem(LS_MI_EQUIPO)||''; }catch(e){}
  var miNombre=''; try{ miNombre=localStorage.getItem(LS_MI_NOMBRE)||''; }catch(e){}
  var t = torneoSeleccionado();
  var equipo = miEquipo || 'mi equipo';
  var invs = loadJSON(LS_INV, []);
  invs.push({equipo: equipo, capitan: miNombre||'Capitán', torneo: t ? (t.nombre||'') : '', jugador: f.nombre, estado: 'pendiente', fecha: new Date().toISOString()});
  saveJSON(LS_INV, invs);
  if (f.wa) abrirWA(f.wa, 'Hola '+(f.nombre||'')+', soy '+(miNombre||'el capitán')+' y te invito al equipo '+equipo+' en Sports Manager. Entra a la app y acepta o rechaza la invitación.');
  else alert('Invitación guardada para '+(f.nombre||'')+'. No tiene WhatsApp guardado.');
  refrescar();
};
window.SMRW_responderInv = function(idx, estado){
  var invs = loadJSON(LS_INV, []); if(!invs[idx]) return;
  invs[idx].estado = estado; saveJSON(LS_INV, invs);
  if (estado==='aceptada'){
    try{ localStorage.setItem(LS_MI_EQUIPO, invs[idx].equipo||''); }catch(e){}
    alert('Aceptaste la invitación a '+(invs[idx].equipo||'')+'. Ya eres parte de ese equipo.');
  } else {
    alert('Rechazaste la invitación a '+(invs[idx].equipo||'')+'.');
  }
  refrescar();
};

document.addEventListener('DOMContentLoaded', function(){ try{ construirUI(); refrescar(); }catch(e){} });
// Si la app tarda en cargar torneos, reintentar refrescar a los 2s
setTimeout(function(){ try{ refrescar(); }catch(e){} }, 2000);
})();
