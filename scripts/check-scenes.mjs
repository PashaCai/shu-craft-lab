// Exercise each real scene's action callbacks without replacing their state logic.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

export function checkSceneFlows(project,ids){
  const core=fs.readFileSync(path.join(project,'dist/assets/core.js'),'utf8');
  for(const id of ids){
    let config;
    const animations=[],messages=[];
    const ui={animate(fn){animations.push(fn);},flash(message){messages.push(message);},render(){}};
    const context=vm.createContext({window:{parent:{}},URLSearchParams,console,addEventListener(){},document:{getElementById(){return null;}},capture(cfg){config=cfg;ui.st=cfg.state;return ui;}});
    vm.runInContext(core,context,{filename:'core.js'});
    vm.runInContext('mountFigure = capture; xrMount = () => {};',context);
    const html=fs.readFileSync(path.join(project,'dist/figures',id+'.html'),'utf8');
    for(const [,attrs,source] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/i.test(attrs)&&source.trim())vm.runInContext(source,context,{filename:id+'.html'});
    assert(config&&config.buttons.length===5,id+': expected four actions and reset');
    const st=config.state,click=index=>config.buttons[index].onClick(st,ui);
    function tick(){for(const fn of [...animations])if(fn(1/60)===false)animations.splice(animations.indexOf(fn),1);}
    function drain(){let count=0;while(animations.length&&count++<1200){const previous=st.progress;tick();assert(Number.isFinite(st.progress)&&st.progress>=previous&&st.progress<=1,id+': invalid progress');}assert.equal(animations.length,0,id+': animation did not finish');}
    click(1);assert.equal(st.step,0,id+': skipped first action');assert.equal(animations.length,0,id+': skip started animation');assert(messages.length,id+': missing order feedback');
    for(let index=0;index<4;index++){
      click(index);click(index);assert.equal(animations.length,1,id+': repeated action queued duplicate animation');
      drain();assert.equal(st.step,index+1,id+': action did not complete');assert.equal(st.progress,(index+1)/4,id+': completion fraction');
      click(index);assert.equal(animations.length,0,id+': completed action repeated');
    }
    assert(st.done,id+': missing completed artwork');
    click(4);assert.equal(st.step,0);assert.equal(st.progress,0);assert.equal(st.done,false);
    click(0);tick();click(4);drain();assert.equal(st.step,0,id+': reset lost to old animation');assert.equal(st.progress,0);assert.equal(st.done,false);
    console.log('Passed making flow, order protection, duplicate clicks and reset: '+id);
  }
}
