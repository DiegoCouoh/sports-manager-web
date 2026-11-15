
// SPORTS MANAGER v3 - SIN PAGAR SERVIDOR, SIN REINSTALAR, SIN RECOMPILAR
(function(){
"use strict";
try{
  var VERSION_LOCAL = "3.0.0";
  var ULTIMA_REVISION = 0;
  function tieneCambiosSinGuardar(){
    try{
      if(window.hayCambiosSinGuardar) return true;
      var el = document.getElementById('avisoCambiosSinGuardar');
      if(el && el.offsetParent !== null) return true;
    }catch(e){}
    return false;
  }
  function revisarNuevaVersion(){
    try{
      fetch('./version.json?t='+Date.now(), {cache:'no-store'}).then(function(r){ return r.json(); }).then(function(j){
        if(j && j.version && j.version !== VERSION_LOCAL){
          var banner = document.getElementById('smBannerUpdate');
          if(!banner){
            banner = document.createElement('div');
            banner.id='smBannerUpdate';
            banner.style.cssText='position:fixed;left:12px;right:12px;bottom:76px;z-index:2000;background:#c9a227;color:#1a1400;border-radius:12px;padding:12px 14px;font-weight:800;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;box-shadow:0 10px 30px rgba(0,0,0,.4)';
            banner.innerHTML='<span>🔄 Hay una nueva versión de Sports Manager ('+j.version+'). No tienes que reinstalar nada.</span><button id="smBtnUpdate" style="border:none;background:#101216;color:#fff;padding:10px 14px;border-radius:8px;font-weight:800;cursor:pointer;">Actualizar ahora</button>';
            document.body.appendChild(banner);
            document.getElementById('smBtnUpdate').onclick=function(){ location.reload(); };
          }
        }
      }).catch(function(){});
    }catch(e){}
  }
  function revisarDatosCompartidos(){
    if(tieneCambiosSinGuardar()) return;
    if(Date.now()-ULTIMA_REVISION < 20000) return;
    ULTIMA_REVISION = Date.now();
    try{
      if(typeof window.cargarDatosDesdeGitHub === 'function'){ window.cargarDatosDesdeGitHub(true); return; }
      if(typeof window.forzarRecargaDatos === 'function'){ window.forzarRecargaDatos(); return; }
    }catch(e){}
  }
  document.addEventListener('DOMContentLoaded', function(){ revisarNuevaVersion(); });
  setInterval(function(){ revisarNuevaVersion(); revisarDatosCompartidos(); }, 25000);
  try{ if('serviceWorker' in navigator){ navigator.serviceWorker.addEventListener('controllerchange', function(){ location.reload(); }); } }catch(e){}
  console.log('SM v3 auto-sync activo: version '+VERSION_LOCAL);
}catch(e){ console.warn('SM v3 auto-sync no pudo iniciar', e); }
})();
