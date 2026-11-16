(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const make = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const button = (text, action, className) => {
    const element = make('button', text, className);
    element.type = 'button';
    element.addEventListener('click', action);
    return element;
  };
  const send = (frame, command, value) => frame?.contentWindow?.postMessage({type:'heritage:command',command,value},location.origin);
  const ns = 'http://www.w3.org/2000/svg';
  function shape(tag, attrs) {
    const element = document.createElementNS(ns,tag);
    for (const [key,value] of Object.entries(attrs)) element.setAttribute(key,value);
    return element;
  }
  let craft, lesson, designFor, live = {}, stage = 0, which = 0, unlocked = false, waiting = false;
  let feedback, advance, controls, reminder, ratio = 0, extras = {}, activeStudy = null;
  let rewind = 0, drawing = false, hasPreview = false;
  let watchArt, watchPeek, peekTimer = 0, peekVisible = false;
  function disconnectPeek() {
    watchArt?.disconnect();watchPeek?.disconnect();clearTimeout(peekTimer);
    peekTimer=0;peekVisible=false;
  }
  function attachPeek() {
    disconnectPeek();
    const peek=byId('operation-model'),frame=byId('craft-frame');
    const svg=frame.contentDocument?.getElementById('fig'),art=frame.contentDocument?.getElementById('art');
    if(!peek||!svg||!art)return;
    function paint() {
      peekTimer=0;if(!peekVisible)return;
      peek.setAttribute('viewBox',svg.getAttribute('viewBox'));
      peek.replaceChildren(...Array.from(art.children,node=>node.cloneNode(true)));
    }
    watchPeek=new IntersectionObserver(([entry])=>{peekVisible=entry.isIntersecting;if(peekVisible)paint();});
    watchPeek.observe(peek);
    watchArt=new MutationObserver(()=>{if(peekVisible&&!peekTimer)peekTimer=setTimeout(paint,100);});
    watchArt.observe(art,{childList:true});
  }
  function preview(amount, fields = {}) {
    ratio = Math.max(0,Math.min(1,amount));
    extras = fields;
    if(drawing)return;
    hasPreview=true;
    send(byId('craft-frame'),'practice-preview',{stage,operation:which,ratio,fraction:(which+ratio)/lesson.stages[stage].operations.length,...fields});
  }
  function acknowledge(correct, text) {
    unlocked = correct;
    advance.disabled = !correct;
    feedback.textContent = text || '';
    feedback.dataset.ok = String(correct);
  }
  function drawTrace(op) {
    const pad = make('div',undefined,'trace-pad');
    const svg = shape('svg',{viewBox:'0 0 100 100',role:'img','aria-label':op.prompt});
    if (op.diagram) svg.innerHTML=op.diagram;
    const points = op.points;
    const line = shape('polyline',{points:points.map(p=>p.join(',')).join(' '),class:'trace-guide'});
    svg.append(line);
    const marks = points.map(([cx,cy])=>shape('circle',{cx,cy,r:2.5,class:'trace-mark'}));
    marks.forEach(m=>svg.append(m));
    const tool = shape('circle',{r:4.2,class:'trace-tool',cx:points[0][0],cy:points[0][1]});
    svg.append(tool);
    let index=0, pointer=null, previous=null;
    const status = make('span',undefined,'instrument-count');
    function place() {
      const [x,y]=points[index];
      tool.setAttribute('cx',x);tool.setAttribute('cy',y);
      marks.forEach((mark,i)=>mark.classList.toggle('passed',i<=index));
      status.textContent=(op.tool||'工具')+' · 已过 '+index+' / '+(points.length-1)+' 点';
      preview(index/(points.length-1));
      if(index===points.length-1) acknowledge(true,op.feedback || '轨迹已完成。');
    }
    function pos(event) {
      const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;
      const local=p.matrixTransform(svg.getScreenCTM().inverse());return [local.x,local.y];
    }
    const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
    function pathInput(p) {
      if(index>=points.length-1)return;
      const a=previous||p, count=Math.max(1,Math.ceil(distance(a,p)/2));
      for(let i=1;i<=count && index<points.length-1;i++){
        const sample=[a[0]+(p[0]-a[0])*i/count,a[1]+(p[1]-a[1])*i/count];
        if(distance(sample,points[index+1])<=5.5){index++;place();}
      }
      previous=p;
    }
    svg.addEventListener('pointerdown',e=>{
      if(pointer!==null||e.button!==0)return;
      const p=pos(e);
      if(distance(p,points[index])>11){feedback.textContent='从实心圆所在的位置开始拖动。';return;}
      pointer=e.pointerId;previous=p;svg.setPointerCapture(pointer);e.preventDefault();
    });
    svg.addEventListener('pointermove',e=>{if(e.pointerId===pointer)pathInput(pos(e));});
    function release(e){if(pointer===e.pointerId){pointer=null;previous=null;}}
    svg.addEventListener('pointerup',e=>{if(pointer===e.pointerId)pathInput(pos(e));release(e);});
    svg.addEventListener('pointercancel',release);
    const stepButton=button('点按走下一点',()=>{if(index<points.length-1){index++;place();}},'instrument-step');
    stepButton.title='使用键盘或点按，让工具移到下一个落点';
    pad.append(svg);
    const legend=make('div',undefined,'trace-legend');legend.append(status,stepButton);
    const guide=make('span','从蓝点起，沿虚线拖动','trace-tip');
    controls.append(guide,pad,legend);place();
  }
  function drawRange(op) {
    const input=make('input');input.type='range';
    input.min=op.min;input.max=op.max;input.step=op.increment||op.step||1;input.value=op.start;
    input.setAttribute('aria-label',op.prompt);
    const readout=make('output');const limits=make('small','目标 '+(op.target[0]===op.target[1]?op.target[0]:op.target.join('–'))+(op.unit||''));
    const head=make('div',undefined,'range-readout');head.append(readout,limits);
    function read(changed) {
      const value=Number(input.value),amount=(value-op.min)/(op.max-op.min);
      readout.textContent=value+(op.unit||'');
      preview(amount,{value,normalizedValue:amount});
      const valid=changed&&value>=op.target[0]&&value<=op.target[1];
      acknowledge(valid,valid?(op.feedback||'已到达目标区间。'):(changed?'继续调整，观察模型变化。':''));
    }
    input.addEventListener('input',()=>read(true));
    if(op.diagram){const diagram=shape('svg',{viewBox:'0 0 100 100',class:'range-diagram','aria-hidden':'true'});diagram.innerHTML=op.diagram;controls.append(diagram);}
    controls.append(head,input);read(false);
  }
  function drawOptions(op) {
    let chosen=0;
    const list=make('div',undefined,'practice-choices');
    if(op.diagram){const diagram=shape('svg',{viewBox:'0 0 100 100',class:'choice-diagram','aria-hidden':'true'});diagram.innerHTML=op.diagram;controls.append(diagram);}
    op.options.forEach((label,index)=>{
      const element=button(label,()=>{
        if(unlocked)return;
        const ordered=op.type==='sequence';
        const correct=ordered?index===op.order[chosen]:index===op.answer;
        if(!correct){acknowledge(false,'再看一下工艺顺序和材料的位置。');return;}
        chosen++;
        const total=ordered?op.order.length:1;
        element.classList.add('chosen');preview(chosen/total,{value:index});
        acknowledge(chosen===total,chosen===total?(op.feedback||'操作正确。'):('已完成 '+chosen+' / '+total+'，继续选择。'));
      });
      list.append(element);
    });
    controls.append(list);preview(0);
  }
  function draw() {
    disconnectPeek();
    const container=byId('practice-body');container.replaceChildren();
    if(!lesson)return;
    if(stage>=lesson.stages.length){
      container.append(make('p','四道工序已完成。可以对照不同阶段，或把作品收进学习手记。','practice-finished'));return;
    }
    const step=lesson.stages[stage],op=step.operations[which];
    const meta=make('div',undefined,'practice-meta');
    meta.append(make('span','工序 '+(stage+1)+' / '+lesson.stages.length),make('span','操作 '+(which+1)+' / '+step.operations.length));
    const heading=make('h3',step.title),prompt=make('p',op.prompt,'operation-prompt');
    controls=make('div',undefined,'practice-instrument');
    feedback=make('p','','practice-feedback');feedback.setAttribute('role','status');
    reminder=make('p',step.observe,'practice-observe');
    const last=which===step.operations.length-1;
    advance=button(last?'完成这道工序':'下一项操作',()=>{
      if(!unlocked||waiting||live.busy)return;
      if(last){waiting=true;advance.disabled=true;feedback.textContent='正在完成这道工序…';send(byId('craft-frame'),'practice-commit',stage);}
      else{which++;draw();byId('practice-body').querySelector('h3')?.focus({preventScroll:true});}
    },'practice-next');
    advance.disabled=true;heading.tabIndex=-1;unlocked=false;
    const guide=make('div',undefined,'operation-guide');guide.append(meta,heading,prompt,reminder);
    const peek=make('figure',undefined,'mobile-model');
    peek.append(shape('svg',{id:'operation-model','aria-hidden':'true'}),make('figcaption','模型随操作更新'));
    guide.append(peek);
    const form=make('div',undefined,'operation-form');form.append(controls,feedback,advance);
    container.append(guide,form);
    drawing=true;hasPreview=false;
    if(op.type==='trace')drawTrace(op);
    else if(op.type==='range')drawRange(op);
    else drawOptions(op);
    drawing=false;
    attachPeek();
  }
  function select(nextCraft, getDesign) {
    craft=nextCraft;lesson=window.ShuLessons?.[craft.id];designFor=getDesign;
    stage=0;which=0;unlocked=false;waiting=false;live={};rewind=0;
    if(!lesson)return;
    byId('study-question').textContent=lesson.question;
    draw();
  }
  function update(state) {
    if(!lesson)return;
    const next=state.step||0;
    const reset=(state.practicereset||0)!==rewind;
    rewind=state.practicereset||0;live=state;
    if(stage!==next||reset){stage=next;which=0;waiting=false;draw();}
    const body=byId('practice-body');
    body.inert=!!state.busy || waiting;
  }
  function mounted(){attachPeek();if(lesson && stage<4)preview(hasPreview?ratio:0,hasPreview?extras:{});}
  function studyFrame(step, kind, description) {
    const frame=make('iframe');frame.title=description;
    const params=new URLSearchParams({...designFor(),step:String(step),showcase:kind,yaw:'45',pitch:'30'});
    if(live.palette)params.set('pal',live.palette);
    if(kind==='parts'){params.set('xr','1');params.set('explode','1');}
    frame.src='figures/'+craft.id+'.html?'+params.toString();
    return frame;
  }
  const dialog=byId('study-dialog');
  function pickPart(i) {
    const part=lesson.parts[i];if(!part)return;
    const box=byId('study-content');
    box.querySelectorAll('[data-part]').forEach((el,n)=>el.setAttribute('aria-pressed',String(n===i)));
    box.querySelector('.part-description').textContent=part.detail;
    send(box.querySelector('iframe'),'highlight-part',part.tag||part.name);
  }
  function openParts() {
    if(!lesson)return;
    activeStudy='parts';byId('study-dialog-title').textContent=craft.name+' · 拆解观察';
    const box=byId('study-content');box.replaceChildren();const frame=studyFrame(4,'parts',craft.name+'部件示意');
    const aside=make('div',undefined,'parts-info');aside.append(make('h3',lesson.question));
    const row=make('div',undefined,'part-picks');
    lesson.parts.forEach((p,i)=>{const b=button(p.name,()=>pickPart(i));b.dataset.part=i;row.append(b);});
    const text=make('p','','part-description');text.setAttribute('aria-live','polite');
    const label=make('label','拖动分开各层','explode-slider');
    const slider=make('input');slider.type='range';slider.min=0;slider.max=100;slider.value=75;label.append(slider);
    slider.oninput=()=>send(frame,'explode-at',slider.value/100);
    aside.append(row,text,label);box.className='study-parts';box.append(frame,aside);
    dialog.showModal();pickPart(0);
    frame.addEventListener('load',()=>{send(frame,'explode-at',slider.value/100);pickPart(0);});
  }
  function openCompare() {
    if(!lesson)return;
    activeStudy='compare';byId('study-dialog-title').textContent=craft.name+' · 工序对照';
    const box=byId('study-content');box.className='study-comparison';box.replaceChildren();
    const steps=['制作前',...craft.steps.map(s=>s[0]+'后')];
    [2,4].forEach((defaultStep,i)=>{
      const column=make('div',undefined,'comparison-item'),label=make('label',i?'右侧工序':'左侧工序');
      const select=make('select');steps.forEach((s,index)=>select.add(new Option(s,index)));select.value=defaultStep;label.append(select);
      const frame=studyFrame(defaultStep,'compare',craft.name+(i?'右':'左')+'侧对照模型');
      select.onchange=()=>{const url=new URL(frame.src);url.searchParams.set('step',select.value);const peer=[...box.querySelectorAll('iframe')].find(f=>f!==frame);const pose=peer?.contentWindow?.heritagePose?.();if(pose){url.searchParams.set('yaw',pose.yaw);url.searchParams.set('pitch',pose.pitch);}frame.src=url.href;};
      column.append(frame,label);box.append(column);
    });
    box.append(make('p','拖动任一模型，两侧会同步旋转。','compare-note'));dialog.showModal();
  }
  addEventListener('message',e=>{
    if(e.origin!==location.origin||!activeStudy||!dialog.open)return;
    const frames=[...byId('study-content').querySelectorAll('iframe')];
    if(!frames.some(f=>f.contentWindow===e.source))return;
    if(e.data?.type==='heritage:pose'&&activeStudy==='compare')frames.filter(f=>f.contentWindow!==e.source).forEach(f=>send(f,'align-camera',e.data.pose));
    if(e.data?.type==='heritage:part'&&activeStudy==='parts'){
      const i=lesson.parts.findIndex(p=>(p.tag||p.name)===e.data.name);
      if(i>=0)pickPart(i);
    }
  });
  byId('study-parts').onclick=openParts;byId('study-compare').onclick=openCompare;
  byId('study-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{activeStudy=null;byId('study-content').replaceChildren();});
  window.ShuPractice={select,update,mounted,openParts,openCompare};
})();

