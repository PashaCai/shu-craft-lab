/* Runtime adapter for the Chengdu lacquer model. All geometry and craft state live
   in the same workshop figure, including the smaller, draggable exhibit view. */
(() => {
 'use strict';
 const ui=window.heritageUI, st=ui.st, svg=document.getElementById('fig');
 const update=(design)=>{laSet(st,design);ui.render();};
 window.LacquerModel=Object.freeze({
  palette:Object.freeze({...laPals}),
  shapes:Object.freeze(Object.keys(laShapes)),
  profile:shape=>(laShapes[shape]||laShapes.bowl).p.slice(),
  setDesign:update
 });
 // Capture before the engine redraws: even selecting the currently active
 // palette deliberately replaces an explicitly customized lacquer color.
 document.getElementById('pals').addEventListener('click',event=>{
  const swatch=event.target.closest('button.sw');if(swatch)st.color=null;
 },true);
 for(const swatch of document.querySelectorAll('#pals .sw')){
  if(laPals[swatch.title])swatch.style.backgroundColor=laPals[swatch.title];
 }
 addEventListener('message',event=>{
  if(event.source!==parent||event.origin!==location.origin||!event.data||event.data.type!=='heritage:lacquer-design')return;
  update(event.data);
 });
 svg.setAttribute('aria-label',st.exhibit?'成都漆艺成品，可拖动旋转':'成都漆艺工坊，可拖动旋转器物');
 if(st.exhibit){
  document.documentElement.classList.add('lacquer-exhibit');
  const style=document.createElement('style');
  style.textContent='html.lacquer-exhibit,html.lacquer-exhibit body{height:100%;min-height:0;margin:0;padding:0;overflow:hidden;background:transparent;display:block}.lacquer-exhibit header,.lacquer-exhibit .controls,.lacquer-exhibit .actions,.lacquer-exhibit .stats,.lacquer-exhibit .mcap,.lacquer-exhibit .vset,.lacquer-exhibit .made-with,.lacquer-exhibit #toast,.lacquer-exhibit #readout{display:none!important}.lacquer-exhibit .stage{width:100%;max-width:none;height:100%}.lacquer-exhibit #fig{display:block;width:100%;max-width:none;height:100%;margin:0;touch-action:none;cursor:grab}.lacquer-exhibit #fig:active{cursor:grabbing}';
  document.head.appendChild(style);
  // The integration bridge uses this initial box for subsequent front / zoom
  // commands as well. The turntable pivot remains centered at all camera angles.
  const [cx,cy]=P(37,37,23),w=106,h=87;
  svg.setAttribute('viewBox',[cx-w/2,cy-h/2,w,h].join(' '));
 }
})();
