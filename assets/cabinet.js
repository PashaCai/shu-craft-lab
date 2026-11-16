(()=> {
  'use strict';
  const key='shu-craft.lacquer-cabinet.v1',shapes={bowl:'漆碗',vase:'漆瓶',box:'漆盒',plate:'漆盘'},patterns={cloud:'云纹',rings:'弦纹',petals:'花瓣纹'};
  const profiles={bowl:[.33,.4,.49,.57,.64,.72,.79,.85,.9,.94,.98,1],vase:[.42,.6,.82,.96,1,.97,.83,.61,.41,.32,.32,.41],box:[.85,.96,1,1,1,1,1,1,.99,.94,.78,.56],plate:[.34,.45,.61,.73,.82,.89,.94,.97,.99,1,1,1]};
  const safeColor=(v,d)=>/^#[a-f\d]{6}$/i.test(v)?v:d;
  function format(raw={}){
    const shape=Object.hasOwn(shapes,raw.shape)?raw.shape:'bowl';
    return {id:String(raw.id||'').slice(0,80),name:String(raw.name||'未命名漆器').trim().slice(0,32)||'未命名漆器',shape,color:safeColor(raw.color,'#922c24'),accent:safeColor(raw.accent,'#d4ae66'),pattern:Object.hasOwn(patterns,raw.pattern)?raw.pattern:'cloud',profile:Array.isArray(raw.profile)&&raw.profile.length===12&&raw.profile.every(v=>Number.isFinite(Number(v)))?raw.profile.map(v=>Math.max(.01,Math.min(1,Number(v)))):null,source:raw.source==='camera'?'camera':raw.source==='sample'?'sample':'workshop',date:Number(raw.date)||0};
  }
  const samples=[format({id:'sample-bowl',name:'朱漆弦纹碗',shape:'bowl',color:'#9c3428',accent:'#e6bd71',pattern:'rings',source:'sample'}),format({id:'sample-vase',name:'墨漆云纹瓶',shape:'vase',color:'#303d39',accent:'#d5ab69',pattern:'cloud',source:'sample'})];
  let cached=[],dialog,opener,current,mode='',media,token=0,url='',reverseSpin=false,draft=null,originMode='';
  const list=()=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(v))cached=v.filter(x=>x&&typeof x==='object'&&x.source!=='sample'&&x.id).map(format);}catch{}return cached;};
  const persist=v=>{try{localStorage.setItem(key,JSON.stringify(v));cached=v;return true;}catch{return false;}};
  function save(raw,source){
    const items=list();const item=format({...raw,id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`,date:Date.now(),source});
    if(!persist([item,...items]))return {ok:false,persisted:false,error:'这台设备无法保存作品，请检查浏览器的存储权限或剩余空间。'};
    current=item.id;return {ok:true,persisted:true,item};
  }
  const saveWorkshop=(raw={})=>{const r=save({...raw,name:raw.name||`${shapes[raw.shape]||'漆器'}习作 ${list().filter(x=>x.source==='workshop').length+1}`},'workshop');if(r.ok&&dialog?.open&&mode==='gallery')gallery(r.item.id);return r;};
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const notes={sample:'工艺示意标本',camera:'实物采集作品',workshop:'工坊创作作品'};
  const $=sel=>dialog.querySelector(sel);
  const setStatus=(v)=>{const n=$('[data-status]');if(n)n.textContent=v;};
  function thumb(item){
    const p=item.profile||profiles[item.shape],cx=72,h={plate:30,box:46,vase:82,bowl:49}[item.shape],w={plate:52,box:42,vase:29,bowl:48}[item.shape],top=(99-h)/2,ys=i=>top+h*(1-i/11),x=(i,k)=>cx+w*p[i]*k,outline=[...p.map((_,i)=>`${x(i,-1)} ${ys(i)}`),...p.map((_,i)=>`${x(11-i,1)} ${ys(11-i)}`)].join(' L ');
    const frac=item.shape==='plate'?1.8:3.4, band=i=>`M ${x(i,-1)} ${ys(i)} Q 72 ${ys(i)+frac*2} ${x(i,1)} ${ys(i)}`;
    let decor=item.pattern==='rings'?`<path d="${band(7)} ${band(8)}" fill="none" stroke="${item.accent}" stroke-width="1.35"/>`:item.pattern==='cloud'?`<path d="M61 ${ys(5)}q4 -5 8 -1 q2 -8 9 -3 q5 4 -1 6 h-13" fill="none" stroke="${item.accent}" stroke-width="1.5"/>`:`<g fill="${item.accent}">${[0,72,144,216,288].map(a=>`<ellipse cx="72" cy="${ys(5)-3}" rx="1.7" ry="3.6" transform="rotate(${a} 72 ${ys(5)})"/>`).join('')}</g>`;
    return `<svg viewBox="0 0 144 100" aria-hidden="true"><ellipse cx="72" cy="${ys(0)+3}" rx="${w*.63}" ry="3.3" fill="#38261c" opacity=".1"/><path d="M ${outline} Z" fill="${item.color}"/><path d="M ${outline} Z" fill="url(#cabGlaze)"/>${decor}<ellipse cx="72" cy="${top}" rx="${w*p[11]}" ry="${Math.max(2,w*p[11]*.105)}" fill="${item.color}" stroke="${item.accent}" stroke-width="1.2"/><ellipse cx="72" cy="${top+.1}" rx="${Math.max(1,w*p[11]-2)}" ry="${Math.max(.8,w*p[11]*.07)}" fill="#190f0a" opacity=".43"/></svg>`;
  }
  function release(){token++;if(media){media.getTracks().forEach(t=>t.stop());media=null;}const v=dialog?.querySelector('video');if(v){v.pause();v.srcObject=null;}if(url){URL.revokeObjectURL(url);url='';}}
  const icon=(kind)=>kind==='camera'?'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13.5" r="3.4"/></svg>':'';
  function ensure(){
    if(dialog)return;dialog=document.createElement('dialog');dialog.className='lc-dialog';dialog.id='lacquer-cabinet';dialog.setAttribute('aria-labelledby','lc-title');
    dialog.innerHTML='<div class="lc-shell"><svg width="0" height="0" aria-hidden="true" class="lc-def"><defs><linearGradient id="cabGlaze"><stop stop-color="#000" stop-opacity=".28"/><stop offset=".25" stop-color="#fff" stop-opacity=".15"/><stop offset=".47" stop-color="#fff" stop-opacity=".03"/><stop offset="1" stop-color="#000" stop-opacity=".21"/></linearGradient></defs></svg><header class="lc-head"><div><small>蜀作 <i>/</i> 数字典藏</small><h2 id="lc-title">漆器展示柜</h2></div><button type="button" class="lc-close" data-do="close" aria-label="关闭展示柜">×</button></header><div class="lc-body"></div><div class="lc-status" role="status" aria-live="polite" data-status></div></div>';
    document.body.append(dialog);dialog.addEventListener('click',clicked);
    dialog.addEventListener('change',e=>{if(e.target.matches('[data-photo]')){const file=e.target.files[0];e.target.value='';if(file)loadFile(file);}});
    const cleanup=()=>{release();draft=null;mode='';$('.lc-body').replaceChildren();if(opener?.isConnected)opener.focus({preventScroll:true});};
    dialog.addEventListener('close',()=>{if(!dialog.open)cleanup();});dialog.addEventListener('cancel',release);
    addEventListener('pagehide',()=>{release();if(dialog.open)dialog.close();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='camera'&&dialog.open&&(media||$('[data-do="start"]')?.disabled))camera('采集已暂停。回到课堂后，可重新开启摄像头。');});
    addEventListener('hashchange',()=>{if(dialog.open&&location.hash!=='#cabinet')dialog.close();});
    addEventListener('message',e=>{const frame=$('.lc-model');if(!frame||e.source!==frame.contentWindow||e.origin!==location.origin||e.data?.type!=='heritage:state')return;reverseSpin=!!e.data.spinning;syncSpin();});
  }
  function show(){ensure();if(!dialog.open){opener=document.activeElement;dialog.showModal();}}
  function screen(m,title,body){release();mode=m;const heading=$('#lc-title');heading.textContent=title;heading.tabIndex=-1;$('.lc-body').innerHTML=body;setStatus('');dialog.scrollTop=0;heading.focus({preventScroll:true});}
  function syncSpin(){const b=$('[data-do="spin"]');if(b){b.setAttribute('aria-pressed',String(reverseSpin));b.textContent=reverseSpin?'暂停旋转':'自动旋转';}}
  function gallery(id){
    show();draft=null;const mine=list(),all=[...mine,...samples],it=all.find(x=>x.id===(id||current))||all[0];current=it.id;reverseSpin=false;
    const q=new URLSearchParams({shape:it.shape,color:it.color,accent:it.accent,pattern:it.pattern,step:'4',exhibit:'1'});if(it.profile)q.set('profile',it.profile.join(','));
    const card=x=>`<button type="button" data-do="select" data-id="${esc(x.id)}" aria-pressed="${x.id===it.id}" class="lc-card"><span class="lc-mini">${thumb(x)}</span><span><strong>${esc(x.name)}</strong><small>${notes[x.source]}</small></span></button>`;
    screen('gallery','漆器展示柜',`<div class="lc-layout"><section class="lc-detail" aria-label="当前展品"><div class="lc-stage"><span class="lc-stage-label"><i></i> 三维展台</span><iframe class="lc-model" title="${esc(it.name)}：拖动旋转三维器物" src="./figures/lacquer.html?${esc(q.toString())}"></iframe><div class="lc-view-controls"><button data-do="spin" aria-pressed="false">自动旋转</button><button data-do="front">回到正面</button></div></div><div class="lc-caption"><div><small>${notes[it.source]}</small><h3>${esc(it.name)}</h3></div><div class="lc-pigments" aria-label="漆色与纹饰色"><i style="background:${it.color}" title="${it.color}"></i><i style="background:${it.accent}" title="${it.accent}"></i></div></div><p class="lc-meta">${shapes[it.shape]}<b>·</b>${patterns[it.pattern]}<b>·</b>${it.source==='camera'?'依据照片轮廓近似重建':it.source==='sample'?'课堂参考标本':'数字工坊制作'}</p>${it.source==='sample'?'':`<div class="lc-manage"><button data-do="edit">编辑作品</button><button data-do="remove">移除作品</button></div><div class="lc-confirm" hidden><span>从本机移除这件作品？</span><button data-do="keep">保留</button><button data-do="confirm-remove">确认移除</button></div>`}</section><aside class="lc-library"><div class="lc-lib-head"><div><small>本机收藏</small><h3>我的作品 <em>${mine.length}</em></h3></div><button class="lc-primary lc-collect" data-do="camera">${icon('camera')} 采集实物</button></div>${mine.length?`<div class="lc-list">${mine.map(card).join('')}</div>`:'<div class="lc-empty"><strong>为第一件漆器留个位置</strong><p>将工坊成品收入柜中，或拍摄身边的器物，生成可旋转的数字作品。</p></div>'}<div class="lc-samples"><h4>工艺标本 <em>02</em></h4><div class="lc-list">${samples.map(card).join('')}</div></div></aside></div>`);
  }
  function camera(msg=''){
    show();draft=null;
    screen('camera','采集实物',`<div class="lc-camera-grid"><div class="lc-camera-view"><video autoplay playsinline muted aria-label="摄像头预览"></video><div class="lc-corners"></div><div class="lc-cam-message">将器物置于画面中央</div></div><section class="lc-camera-help"><small>实物入柜 <i>/</i> 01 取景</small><h3>留下器物的轮廓</h3><p>在对比明显的纯色背景前，从正面平视器物。拍全口沿与底足，四周留白。</p><button class="lc-primary" data-do="start">${icon('camera')} 开启摄像头</button><button class="lc-primary" data-do="shutter" hidden>拍摄并提取</button><button class="lc-secondary" data-do="file">从相册选择照片</button><input type="file" accept="image/*" data-photo hidden><p class="lc-private">照片仅在本机分析。展示柜只保存器形、颜色和纹样，不保存原照片。</p><button class="lc-link" data-do="back">返回展示柜</button></section></div>`);
    if(msg)setStatus(msg);
  }
  async function startCamera(){
    release();const generation=token,s=$('[data-do="start"]'),v=$('video');if(!s||!v)return;
    s.disabled=true;setStatus('正在请求摄像头权限…');
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw Error('当前环境无法使用摄像头。请使用 HTTPS 或本机地址打开，也可从相册选择照片。');
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280}},audio:false});
      if(generation!==token||!dialog.open){stream.getTracks().forEach(t=>t.stop());return;}media=stream;v.srcObject=stream;
      stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{if(media===stream&&dialog.open&&mode==='camera')camera('摄像头连接已中断，可重新开启或选择照片。');},{once:true}));
      await v.play();if(generation!==token||!dialog.open)return;
      s.hidden=true;$('[data-do="shutter"]').hidden=false;$('.lc-cam-message').hidden=true;setStatus('摄像头已就绪。拍摄后可核对器形与色彩。');$('[data-do="shutter"]').focus();
    }catch(e){
      if(generation!==token)return;release();s.disabled=false;
      setStatus(({NotAllowedError:'未获得摄像头权限。可从相册选择照片，或在浏览器设置中允许后重试。',NotFoundError:'没有检测到摄像头，请从相册选择照片。',NotReadableError:'摄像头可能正被其他程序使用，请关闭后重试或选择照片。'})[e.name]||e.message||'摄像头不可用，请选择照片。');
    }
  }
  function analyze(source){try{
    const r=window.LacquerVision.extract(source);draft={...r,name:`实物${shapes[r.shape]}`,pattern:'rings',source:'camera'};editor('photo');
  }catch(e){camera(e.message||'暂未识别出器物，请调整背景后重试。');}}
  async function loadFile(file){
    camera();const generation=token;
    if(file.size>40*1024*1024){setStatus('这张图片过大，请选择小于 40 MB 的照片。');return;}
    if(file.type&&!file.type.startsWith('image/')){setStatus('请选择图片文件。');return;}
    setStatus('正在本机分析照片…');
    const img=new Image();url=URL.createObjectURL(file);img.src=url;
    try{await img.decode();if(generation===token&&dialog.open)analyze(img);}catch{if(generation===token)camera('无法读取这张图片，请换用 JPEG、PNG 或 WebP 照片。');}
  }
  const options=(pairs,v)=>Object.entries(pairs).map(([val,label])=>`<option value="${val}" ${val===v?'selected':''}>${label}</option>`).join('');
  function editor(from){
    originMode=from;const p=draft,photo=from==='photo';
    screen('edit',photo?'校准实物作品':'编辑作品',`<div class="lc-edit-grid"><div class="lc-preview"><small>${photo?'已提取的实物轮廓':'作品预览'}</small>${photo?`<img alt="照片中分离出的器物" src="${p.preview}">`:`<div data-thumb>${thumb(p)}</div>`}<span>${photo?'原始照片不会存入展示柜':'三维参数示意图'}</span></div><form class="lc-form"><small>${photo?'实物入柜 / 02 核对':'本机收藏 / 作品资料'}</small><h3>${photo?'核对识别结果':'修改作品资料'}</h3><p>${photo?`${p.clipped?'轮廓贴近画面边缘，可返回重拍。':''}已提取 12 段轮廓与${p.hasAccent?'主辅色':'主色（未分出辅色）'}。请选择合适的器形与纹样。`:'名称、器形与配色可随时调整。'}</p><label>作品名称<input name="name" required maxlength="32" value="${esc(p.name)}"></label><div class="lc-fields"><label>器形<select name="shape">${options(shapes,p.shape)}</select></label><label>纹样<select name="pattern">${options(patterns,p.pattern)}</select></label></div><div class="lc-fields"><label>漆色<input type="color" name="color" value="${p.color}"></label><label>纹饰色<input type="color" name="accent" value="${p.accent}"></label></div><div class="lc-form-actions"><button class="lc-primary" type="submit">${photo?'收入展示柜':'保存修改'}</button><button class="lc-secondary" type="button" data-do="${photo?'retake':'back'}">${photo?'重新取景':'取消'}</button></div></form></div>`);
    const f=$('form');f.addEventListener('input',()=>{const t=$('[data-thumb]');if(t)t.innerHTML=thumb({...p,...Object.fromEntries(new FormData(f))});});
    f.addEventListener('submit',e=>{
      e.preventDefault();const raw={...draft,...Object.fromEntries(new FormData(f))};if(!raw.name.trim()){setStatus('请给作品起一个名字。');f.elements.name.focus();return;}
      if(originMode==='photo'){const r=save(raw,'camera');if(!r.ok){setStatus(r.error);return;}gallery(r.item.id);setStatus('实物作品已收入本机展示柜。');}
      else{const items=list();if(!items.some(x=>x.id===raw.id)){gallery();setStatus('这件作品已在其他窗口移除。');return;}if(!persist(items.map(x=>x.id===raw.id?format(raw):x))){setStatus('保存失败，请检查浏览器存储权限。');return;}gallery(raw.id);setStatus('作品资料已更新。');}
      $('.lc-caption h3')?.scrollIntoView?.({block:'nearest'});$('.lc-close').focus({preventScroll:true});
    });
  }
  function clicked(e){
    const b=e.target.closest('[data-do]');if(!b)return;
    switch(b.dataset.do){
      case 'close':release();dialog.close();break;
      case 'select':gallery(b.dataset.id);$('.lc-card[aria-pressed="true"]')?.focus({preventScroll:true});break;
      case 'back':gallery(current);break;
      case 'spin':case 'front':$('.lc-model')?.contentWindow?.postMessage({type:'heritage:command',command:b.dataset.do},location.origin==='null'?'*':location.origin);break;
      case 'camera':case 'retake':camera();$('[data-do="start"]').focus({preventScroll:true});break;
      case 'start':startCamera();break;
      case 'shutter':analyze($('video'));break;
      case 'file':if(media||$('[data-do="start"]')?.disabled)camera();$('[data-photo]').click();break;
      case 'edit':draft=list().find(x=>x.id===current);if(draft){editor('existing');$('input[name="name"]').focus();}break;
      case 'remove':$('.lc-manage').hidden=true;$('.lc-confirm').hidden=false;$('[data-do="keep"]').focus();break;
      case 'keep':$('.lc-confirm').hidden=true;$('.lc-manage').hidden=false;$('[data-do="remove"]').focus();break;
      case 'confirm-remove':if(!persist(list().filter(x=>x.id!==current))){setStatus('未能移除，请检查浏览器存储权限。');break;}current=null;gallery();setStatus('作品已从本机展示柜移除。');$('.lc-close').focus();break;
    }
  }
  window.LacquerCabinet=Object.freeze({open:()=>gallery(),openCamera:()=>{camera();startCamera();},saveWorkshop});
})();
