/* Integration layer for the MIT-licensed Colorfigures engine (CJK labels adapted).
   Models retain native rendering, camera, actions and physical craft states. */
(() => {
  'use strict';
  const ui = window.heritageUI;
  if (!ui) { console.error('Heritage scene did not expose its UI'); return; }
  const embedded = window.parent !== window;
  const id = window.heritageId;
  const initial = JSON.parse(JSON.stringify(ui.st));
  const style = document.createElement('style');
  style.textContent = `
    body,button,input{font-family:"Microsoft YaHei","PingFang SC",sans-serif}
    #fig text{font-family:"Microsoft YaHei","PingFang SC",sans-serif}
    .act{font-size:11px;letter-spacing:.25px;padding:7px 13px;border-width:1px;background:#f2efe7df}
    .actions{gap:9px}.stat .k{font-size:9px;letter-spacing:1px}.stat .v{font-family:Georgia,"SimSun",serif;font-size:30px}.stat.small .v{font-size:17px}
    .toast{font-size:11px;letter-spacing:0;line-height:1.8;box-shadow:2px 2px 0 #b5a78c;border-width:1px;text-transform:none;max-width:200px;background:#f5efdf}
    ${embedded ? `html,body{height:100%;min-height:0;overflow:hidden}body{padding:0;background:transparent;display:block}header,.controls,.made-with,.mcap,.vset,#readout,.idea{display:none!important}.stage{max-width:none;width:100%;height:100%;position:relative}#fig{width:100%;max-width:none;height:100%;margin:0;display:block;overflow:visible;touch-action:none}.actions{top:24px;left:25px;max-width:170px}.stats{top:24px;right:25px;position:absolute;display:flex}.actions .stepwrap{max-width:100%}.chips{z-index:10} .stage{isolation:isolate}` : ''}
    @media(max-width:560px){${embedded ? `.actions{position:absolute;top:17px;left:18px;right:85px;max-width:none;flex-direction:row;gap:6px}.act{font-size:10px;padding:5px 9px}.stats{position:absolute;top:18px;right:18px;gap:4px}.stat .k{font-size:8px}.stat .v{font-size:23px}.stat.small .v{font-size:13px}.chips{left:0;top:calc(100% + 7px);max-width:260px}.toast{max-width:220px;left:18px;font-size:10px}` : ''}}
  `;
  document.head.appendChild(style);
  document.documentElement.lang = 'zh-CN';
  document.querySelector('label[for=wb]')?.replaceChildren(document.createTextNode('手绘线条'));
  const translations = {vreset:'回到正面',vspin:'自动旋转',xrb:'透视内部',lblb:'部件标注'};
  Object.entries(translations).forEach(([key,label]) => { const el = document.getElementById(key); if(el) el.textContent=label; });
  let zoom = 1, explodeTarget = Math.round(ui.st.explode || 0), lastMessage = '', token = 0;
  const svg = document.getElementById('fig');
  const originalBox = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  window.LBL_U = () => innerWidth < 560 ? svg.viewBox.baseVal.width / Math.max(1,svg.getBoundingClientRect().width) : 0;
  const fit = () => {
    const [x,y,w,h] = originalBox;
    const mobile = innerWidth < 560;
    // The camera still rotates in true 3D; this only frames the finished SVG.
    const factor = (mobile ? 1.04 : 1.04) / zoom;
    const nw=w*factor, nh=h*factor;
    svg.setAttribute('viewBox',`${x+(w-nw)/2} ${y+(h-nh)/2-(mobile?h*.06:0)} ${nw} ${nh}`);
  };
  fit();
  addEventListener('resize',()=>{fit();ui.render();});
  const report = (force=false) => {
    const st = ui.st;
    const state = {type:'heritage:state',id,progress:Math.max(0,Math.min(1,Number(st.progress)||0)),step:Number(st.step)||0,done:!!st.done,xray:!!st.xrT,labels:!document.documentElement.classList.contains('nolabels'),exploded:explodeTarget===1,spinning:document.getElementById('vspin')?.getAttribute('aria-pressed')==='true',palette:st.pal,zoom};
    state.parts = state.labels ? [...document.querySelectorAll('#fig .tag[data-t]')].map(el=>({number:el.dataset.n,name:el.dataset.t})).filter((part,index,all)=>all.findIndex(other=>other.number===part.number)===index) : [];
    const serialized = JSON.stringify(state);
    if(force || serialized!==lastMessage){lastMessage=serialized;if(embedded)window.parent.postMessage(state,location.origin);}
    document.documentElement.dataset.progress = state.progress;
    document.documentElement.dataset.step = state.step;
    document.documentElement.dataset.done = state.done;
  };
  const nativeRender=ui.render;
  ui.render=()=>{nativeRender();report();};
  function setZoom(value){zoom=Math.max(.7,Math.min(1.7,value));fit();report(true);}
  svg.addEventListener('wheel',event=>{event.preventDefault();setZoom(zoom+(event.deltaY<0?.1:-.1));},{passive:false});
  addEventListener('message',event=>{
    if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='heritage:command') return;
    const {command,value}=event.data;
    if(command==='xray')document.getElementById('xrb')?.click();
    if(command==='labels'){
      document.getElementById('lblb')?.click();
      if(!document.documentElement.classList.contains('nolabels')&&!ui.st.xrT&&!explodeTarget)document.getElementById('xrb')?.click();
    }
    if(command==='front'){document.getElementById('vreset')?.click();setZoom(1);}
    if(command==='spin')document.getElementById('vspin')?.click();
    if(command==='zoom')setZoom(value==='reset'?1:zoom+Number(value));
    if(command==='wobble'){const input=document.getElementById('wb');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}
    if(command==='palette'){const button=[...document.querySelectorAll('#pals .sw')].find(b=>b.title===value);button?.click();}
    if(command==='explode'){
      explodeTarget=explodeTarget?0:1;const generation=++token;
      if(explodeTarget){document.documentElement.classList.remove('nolabels');document.getElementById('lblb')?.setAttribute('aria-pressed','true');}
      ui.animate(dt=>{if(generation!==token)return false;ui.st.explode=Math.max(0,Math.min(1,(ui.st.explode||0)+Math.sign(explodeTarget-(ui.st.explode||0))*dt/0.7));return Math.abs(explodeTarget-ui.st.explode)>.001;});
    }
    if(command==='action'){const button=[...document.querySelectorAll('#btns .act')].find(b=>b.textContent.startsWith(value));button?.click();}
    if(command==='reset'){
      const reset=[...document.querySelectorAll('#btns .act')].find(b=>/重|复位/.test(b.textContent));
      if(reset)reset.click();else{Object.assign(ui.st,JSON.parse(JSON.stringify(initial)));ui.render();}
    }
    if(command==='capture'){
      const clone=svg.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width','1200');clone.setAttribute('height','900');
      const background=document.createElementNS('http://www.w3.org/2000/svg','rect');const vb=svg.viewBox.baseVal;Object.entries({x:vb.x,y:vb.y,width:vb.width,height:vb.height,fill:'#f2efe7'}).forEach(([k,v])=>background.setAttribute(k,v));clone.insertBefore(background,clone.firstChild);
      const exportStyle=document.createElementNS('http://www.w3.org/2000/svg','style');exportStyle.textContent='text{font-family:"Microsoft YaHei",sans-serif}.tag text{fill:#28271f}.tag rect{fill:#f8edce;stroke:#28271f}.tag.on rect{fill:#f4b829}'+(document.documentElement.classList.contains('nolabels')?'.tag{display:none}':'');clone.insertBefore(exportStyle,clone.firstChild);
      parent.postMessage({type:'heritage:capture',id,purpose:value||'download',svg:new XMLSerializer().serializeToString(clone)},location.origin);
    }
    ui.render();report(true);
  });
  document.getElementById('lblb')?.addEventListener('click',()=>report(true));
  ui.render();
  document.documentElement.dataset.ready='true';
  if(embedded)parent.postMessage({type:'heritage:ready',id},location.origin);
  report(true);
})();
