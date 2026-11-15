(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const crafts = window.CRAFTS;
  const frame = $('craft-frame');
  const dialog = $('info-dialog');
  let current = crafts.find(c=>c.id===location.hash.slice(1)) || crafts[0];
  let currentState = {progress:0,step:0,done:false};
  let saved = {}, notes = '', toastTimer, loadTimer, ready = false, tab = 'make';
  try { const stored=JSON.parse(localStorage.getItem('shu-craft-notebook-v1')||'{}'); saved=stored.works||{}; notes=stored.notes||''; } catch { /* A private browser can still explore every workshop. */ }
  const escape = value => String(value).replace(/[&<>"']/g, char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const toast = message => { $('app-toast').textContent=message;$('app-toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('app-toast').classList.remove('show'),3200); };
  const persist = () => { try{localStorage.setItem('shu-craft-notebook-v1',JSON.stringify({works:saved,notes}));}catch{toast('浏览器未允许保存，仍可下载学习手记。');} };
  const artworkMemory = new Map();
  function artworkDatabase(){
    return new Promise((resolve,reject)=>{const request=indexedDB.open('shu-craft-artworks-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('works');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  }
  async function storeArtwork(id,svg){
    artworkMemory.set(id,svg);
    try{const db=await artworkDatabase();await new Promise((resolve,reject)=>{const transaction=db.transaction('works','readwrite');transaction.objectStore('works').put(svg,id);transaction.oncomplete=resolve;transaction.onerror=()=>reject(transaction.error);});db.close();}catch{toast('作品可在本次会话下载；浏览器未允许长期保存插画。');}
  }
  async function readArtwork(id){
    if(artworkMemory.has(id))return artworkMemory.get(id);
    if(saved[id]?.artwork)return saved[id].artwork;
    try{const db=await artworkDatabase();const result=await new Promise((resolve,reject)=>{const request=db.transaction('works').objectStore('works').get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});db.close();return result;}catch{return null;}
  }
  const send = (command,value) => { if(!ready) return toast('工作台正在就位，请稍等片刻。');frame.contentWindow.postMessage({type:'heritage:command',command,value},location.origin); };
  function renderCatalog(){
    $('craft-nav').innerHTML=crafts.map((c,i)=>`<a href="#${c.id}" class="craft-link" ${c.id===current.id?'aria-current="page"':''}><span class="craft-icon">${craftIcon(c)}</span><span><span class="craft-index">CRAFT 0${i+1}</span><strong>${c.name}</strong><span class="craft-place">${c.place}</span></span>${saved[c.id]?'<span class="craft-done" aria-label="已收藏">✓</span>':''}</a>`).join('');
    const count=Object.keys(saved).filter(id=>crafts.some(c=>c.id===id)).length;
    $('notebook-count').textContent=count;$('visited-count').textContent=`${count} / 5`;$('visited-fill').style.width=`${count*20}%`;
    if(innerWidth<=620){const selected=$('craft-nav').querySelector('[aria-current=page]');$('craft-nav').scrollLeft=selected.offsetLeft-$('craft-nav').clientWidth/2+selected.clientWidth/2;}
  }
  function setTab(value){tab=value;for(const which of ['make','learn']){$(`tab-${which}`).setAttribute('aria-selected',which===value);$(`${which}-panel`).hidden=which!==value;}}
  function renderProgress(){
    const progress=Math.round(Math.max(0,Math.min(1,currentState.progress||0))*100);
    const complete=currentState.done;
    const count=Math.max(0,Math.min(4,currentState.step||0));
    $('process-list').innerHTML=current.steps.map((step,i)=>`<li class="${i<count?'complete':i===count&&!complete?'current':''}"><span class="step-number">${i<count?'✓':String(i+1).padStart(2,'0')}</span><strong>${step[0]}</strong><p>${step[1]}</p></li>`).join('');
    $('progress-label').textContent=complete?'一件手作，亲手完成':progress>0?'手艺正在发生':'从第一步，开始体验';
    $('progress-number').textContent=`${progress}%`;$('making-fill').style.width=`${progress}%`;
    $('collect-work').classList.toggle('unlocked',complete);
    $('collect-work').querySelector('span').textContent=saved[current.id]?'已收进手记 · 再存一份':'收进我的手记';
    $('collect-hint').textContent=complete?'做到了！把这次体验留在你的学习手记里。':'完成制作，收藏你的第一件非遗作品。';
    for(const [id,key] of [['xray-toggle','xray'],['labels-toggle','labels'],['explode-toggle','exploded'],['spin-toggle','spinning']])$(id).setAttribute('aria-pressed',!!currentState[key]);
    document.querySelectorAll('[data-palette]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.palette===currentState.palette));
    $('zoom-reset').textContent=`${Math.round((currentState.zoom||1)*100)}%`;
    $('part-legend').innerHTML=(currentState.parts||[]).map(part=>`<span><b>${escape(part.number)}</b>${escape(part.name)}</span>`).join('');
  }
  function renderQuiz(){
    $('quiz-question').textContent=current.quiz.q;
    $('quiz-feedback').textContent='';
    $('quiz-options').innerHTML=current.quiz.options.map((option,i)=>`<button data-answer="${i}">${String.fromCharCode(65+i)}. ${option}</button>`).join('');
    $('quiz-options').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
      const answer=Number(button.dataset.answer),correct=answer===current.quiz.answer;
      $('quiz-options').querySelectorAll('button').forEach(el=>el.classList.remove('correct','incorrect'));
      button.classList.add(correct?'correct':'incorrect');
      $('quiz-feedback').textContent=correct?`答对了。${current.quiz.explain}`:'再观察一下。打开透视或拆解，看看它是怎样做出来的。';
      if(correct&&saved[current.id]){saved[current.id].quiz=true;persist();}
    }));
  }
  function selectCraft(craft,initial=false){
    current=craft;ready=false;currentState={progress:0,step:0,done:false,palette:craft.palette,zoom:1};
    const index=crafts.indexOf(craft);
    $('fig-number').textContent=`工坊 0${index+1}`;$('craft-category').textContent=craft.category;$('craft-location').textContent=`四川 · ${craft.place}`;
    $('craft-title').textContent=craft.title;$('craft-subtitle').textContent=craft.subtitle;$('product-name').textContent=craft.product;
    $('craft-description').textContent=craft.description;$('look-note').textContent=craft.look;$('source-link').href=craft.source;$('source-link').title=craft.sourceTitle;
    $('loading').hidden=false;frame.classList.remove('ready');frame.title=`${craft.name}互动工坊：可旋转、透视与拆解`;
    document.title=`${craft.name} · 蜀作非遗互动工坊`;
    renderCatalog();renderQuiz();renderProgress();setTab(tab);
    frame.src=`figures/${craft.id}.html`;
    clearTimeout(loadTimer);loadTimer=setTimeout(()=>{if(!ready){$('loading').querySelector('span:last-child').textContent='场景尚未加载，点这里重新打开工作台';$('loading').style.cursor='pointer';}},12000);
  }
  function openDialog(title,html){$('dialog-kicker').textContent=title;$('dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();}
  function openAbout(){openDialog('关于工坊 · 手艺有来处',`<span class="dialog-label">SHU CRAFT LAB</span><h2>让传统手艺，<br>在指尖发生。</h2><p>蜀作是一间为学生准备的四川非遗互动工坊。这里把手艺的材料、结构和关键工序，变成可以旋转、拆解和操作的立体小模型。先观察，再动手，最后带走一个自己的发现。</p><h3>我们怎样呈现这些手艺</h3><p>模型为课堂简化示意，工序经过提炼，针线、篾条等细节适当放大。它帮助理解工艺关系，不能代替传承人的现场教学。五个场景的造型与纹样为本项目原创。</p><h3>资料与参考</h3><ul>${crafts.map(c=>`<li><a href="${c.source}" target="_blank" rel="noopener">${c.sourceTitle}</a></li>`).join('')}<li><a href="https://www.lantern-museum.cn/product/2084114740.html" target="_blank" rel="noopener">中国彩灯博物馆 · 自贡彩灯传统制作技艺</a></li></ul><p>国家级项目中，与本灯彩工坊相关的是“灯会（自贡灯会）”；彩灯传统制作技艺另有省级项目。这里不把不同名录混为同一个项目。</p><h3>绘图引擎与美术参考</h3><p>使用 <a href="https://april-zhu.com/colorfigures" target="_blank" rel="noopener">April Zhu 的 Colorfigures</a> 绘图引擎与手绘风格。保留 MIT 许可和原作者署名，模型可在离线环境运行。<a href="assets/COLORFIGURES-LICENSE.txt" target="_blank">查看许可证</a>。</p><p>学习记录仅保存在当前浏览器，无需注册；可下载自己的作品与学习手记。</p>`);}
  function openHelp(){openDialog('第一次来 · 把手艺玩明白',`<h2>转一转，拆开看，亲手做。</h2><ol><li><b>选一间工坊。</b>左侧的五门手艺，每一门都有不同的材料和方法。</li><li><b>拖动模型。</b>按住模型空白处左右拖动可旋转，上下拖动改变俯仰；滚轮或 ＋ / − 缩放。双击或“回到正面”恢复视角。</li><li><b>按工序制作。</b>从工作台左上的第一个操作按钮开始，每一步都会让材料和工具动起来。顺序不对时，工坊会给出提示。</li><li><b>看内部与拆解。</b>“透视内部”让外层变淡；“拆开看看”把部件分开；“部件标注”显示它们的名称。再次点击可以合回去。</li><li><b>完成并收藏。</b>进度达到 100% 后，把作品收入学习手记；“读懂它”中还有一道小问题。</li></ol><h3>给老师</h3><p>点击右上角“课堂演示”，放大工作台，适合投屏讲解。可先让同学猜一猜结构，再拆开验证；五间工坊也适合进行经纬、针线与编织的比较观察。</p><p>键盘也能旋转：先点一下工作台空白处，再使用方向键。所有操作按钮都可以用 Tab 键选择。</p>`);}
  function openCraftAbout(){openDialog(`工坊 0${crafts.indexOf(current)+1} · ${current.name}`,`<span class="dialog-label">四川 · ${current.place} / ${current.category}</span><h2>${current.title}</h2><p>${current.description}</p><h3>观察任务</h3><p>${current.look}</p><h3>这个模型简化了什么</h3><p>${current.note}</p><p><a href="${current.source}" target="_blank" rel="noopener">${current.sourceTitle} ↗</a></p><button class="dialog-button" id="go-explore">回到工作台，试试看</button>`);$('go-explore').onclick=()=>dialog.close();}
  function download(name,data,type){const url=URL.createObjectURL(new Blob([data],{type}));const link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function downloadNotebook(){
    const text=['蜀作 · 我的非遗学习手记','',`已完成 ${Object.keys(saved).length} / 5 间工坊`,'',...crafts.map(c=>`${saved[c.id]?'[已完成]':'[待体验]'} ${c.name}（四川 · ${c.place}）\n观察：${c.look}\n${saved[c.id]?.quiz?'已答对工艺小问题。':''}\n资料：${c.source}\n`),'我的发现',notes||'还没有写下发现。','','本学习手记由蜀作生成。模型为课堂简化示意。绘图引擎：Colorfigures / April Zhu。'].join('\n');
    download('蜀作-我的非遗学习手记.txt',text,'text/plain;charset=utf-8');
  }
  function openNotebook(){
    openDialog('我的学习手记 · 留住每一次发现',`<span class="dialog-label">MY CRAFT NOTEBOOK</span><h2>手做过的，心会记得。</h2><p>每完成一次制作，就留下一枚手艺印记。记录保存在这台设备的当前浏览器里。</p><div>${crafts.map(c=>`<div class="notebook-item ${saved[c.id]?'done':''}"><span>${craftIcon(c)}</span><div><h3>${c.name}</h3><p>${saved[c.id]?`${c.product} · ${escape(saved[c.id].date)}${saved[c.id].quiz?' · 小问题已答对':''}`:'去工坊，完成你的第一件作品。'}</p></div><span class="status">${saved[c.id]?'已收藏':'待体验'}</span></div>`).join('')}</div><h3>写下一个自己的发现</h3><label for="student-notes" class="fine-print">例如：我发现织锦与刺绣的花纹形成方式不一样。</label><textarea id="student-notes" class="notebook-notes" placeholder="今天，我发现……">${escape(notes)}</textarea><div class="dialog-actions"><button id="download-notes" class="dialog-button">下载学习手记 ↓</button><button id="download-artwork" class="dialog-button secondary">下载当前作品 SVG ↓</button></div>`);
    $('student-notes').addEventListener('input',event=>{notes=event.target.value;persist();});
    $('download-notes').onclick=downloadNotebook;
    $('download-artwork').onclick=async()=>{if(currentState.done)return send('capture');const artwork=await readArtwork(current.id);if(artwork){download(`蜀作-${current.name}-我的作品.svg`,artwork,'image/svg+xml;charset=utf-8');return;}toast('先完成当前工坊的制作，再带走自己的作品。');};
  }
  addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.id!==current.id)return;
    const message=event.data;
    if(message.type==='heritage:ready'){
      ready=true;clearTimeout(loadTimer);$('loading').hidden=true;frame.classList.add('ready');$('loading').style.cursor='';
      frame.contentWindow.postMessage({type:'heritage:command',command:'wobble',value:$('wobble').value},location.origin);
    }
    if(message.type==='heritage:state'){currentState=message;renderProgress();}
    if(message.type==='heritage:capture'){
      if(message.purpose==='save'&&saved[message.id]){storeArtwork(message.id,message.svg);delete saved[message.id].artwork;persist();}
      else{download(`蜀作-${current.name}-我的作品.svg`,message.svg,'image/svg+xml;charset=utf-8');toast('作品已导出为可缩放的 SVG 插画。');}
    }
  });
  addEventListener('hashchange',()=>{const craft=crafts.find(c=>c.id===location.hash.slice(1));if(craft&&craft.id!==current.id)selectCraft(craft);});
  $('xray-toggle').onclick=()=>send('xray');$('labels-toggle').onclick=()=>send('labels');$('explode-toggle').onclick=()=>send('explode');$('front-view').onclick=()=>send('front');$('spin-toggle').onclick=()=>send('spin');
  $('zoom-in').onclick=()=>send('zoom',.1);$('zoom-out').onclick=()=>send('zoom',-.1);$('zoom-reset').onclick=()=>send('zoom','reset');
  $('wobble').oninput=event=>{$('wobble-value').textContent=event.target.value;send('wobble',event.target.value);};
  document.querySelectorAll('[data-palette]').forEach(button=>button.onclick=()=>send('palette',button.dataset.palette));
  $('tab-make').onclick=()=>setTab('make');$('tab-learn').onclick=()=>setTab('learn');
  $('craft-about').onclick=openCraftAbout;
  $('classroom').onclick=()=>{const active=document.body.classList.toggle('classroom');$('classroom').setAttribute('aria-pressed',active);$('classroom').querySelector('span').textContent=active?'退出课堂':'课堂演示';};
  document.querySelectorAll('[data-open]').forEach(button=>button.onclick=()=>{const key=button.dataset.open;if(key==='about')openAbout();if(key==='help')openHelp();if(key==='notebook')openNotebook();if(key==='workshop'){dialog.close();$('main').scrollIntoView({behavior:'smooth'});}});
  $('close-dialog').onclick=()=>dialog.close();dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
  $('collect-work').onclick=()=>{
    if(!currentState.done){setTab('make');return toast('先按顺序完成左侧四道工序，再收藏这件作品。');}
    saved[current.id]={...saved[current.id],date:new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Shanghai'}).format(new Date()),palette:currentState.palette};
    persist();renderCatalog();renderProgress();toast(`${current.product}已收进手记。试试“读懂它”里的小问题。`);
    send('capture','save');
  };
  $('loading').onclick=()=>{if(!ready){frame.src=`figures/${current.id}.html?reload=${Date.now()}`;$('loading').querySelector('span:last-child').textContent='正在重新摆好工作台…';}};
  selectCraft(current,true);
})();
