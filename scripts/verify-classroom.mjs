// Optional browser test: Playwright and a Chromium browser, with a fresh temporary profile.
// No real camera or student data is used. Serve from a project subpath as on GitHub Pages.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { checkCamera } from './check-camera.mjs';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const artifacts=fileURLToPath(new URL('../qa/',import.meta.url));
const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright');}catch{playwright=require(path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules','playwright'));}
const edge=process.platform==='win32'&&path.join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','Microsoft/Edge/Application/msedge.exe');
const prefix='/shu-craft-lab/';
const server=createServer(async(req,res)=>{
  try{const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(!route.startsWith(prefix))throw Error();
    const f=path.resolve(root,route.slice(prefix.length)||'index.html');
    if(!f.startsWith(path.resolve(root)+path.sep)||!(await stat(f)).isFile())throw Error();
    res.setHeader('content-type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'})[path.extname(f)]||'application/octet-stream');
    res.end(await readFile(f));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+prefix;
let browser;
try{
  browser=await playwright.chromium.launch({headless:true,...(edge&&existsSync(edge)?{executablePath:edge}:{}),args:['--disable-background-networking','--disable-gpu','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
  const context=await browser.newContext({viewport:{width:1440,height:960},acceptDownloads:true,locale:'zh-CN'});
  const page=await context.newPage();page.setDefaultTimeout(16000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base+'#jin');
  // Restore the actual storage schema used by the previous version.
  await page.evaluate(()=>localStorage.setItem('shu-craft-notebook-v1',JSON.stringify({works:{xiu:{date:'2026/11/15',quiz:true}},notes:'我记得蜀绣的底缎。'})));
  await page.reload();await page.locator('#craft-frame.ready').waitFor();
  assert.equal(await page.locator('#visited-count').innerText(),'1 / 6');
  await page.locator('[data-open=notebook]').first().click();
  assert.equal(await page.locator('#student-notes').inputValue(),'我记得蜀绣的底缎。');
  const notes=page.waitForEvent('download');await page.locator('#download-notes').click();assert.match((await notes).suggestedFilename(),/\.txt$/);
  await page.locator('#close-dialog').click();
  // Keep all original craft paths, teaching actions, descriptions, and save/quiz flows.
  for(const id of ['jin','xiu','bamboo','print','lantern','lacquer']){
    await page.locator('a.craft-link[href="#'+id+'"]').click();
    await page.waitForFunction(id=>document.querySelector('#craft-frame.ready')?.contentWindow?.heritageId===id,id);
    const f=page.frameLocator('#craft-frame');
    const acts=f.locator('#btns .act');assert.equal(await acts.count(),5,id+' action count');
    if(id==='lacquer'){
      await page.selectOption('#lacquer-shape','vase');await page.selectOption('#lacquer-pattern','petals');
      await page.locator('[data-palette=mint]').click();
    }
    for(let n=0;n<4;n++){
      await acts.nth(n).click();
      await page.waitForFunction(s=>Number(document.querySelector('#craft-frame').contentDocument.documentElement.dataset.step)===s,n+1);
      if(id==='lacquer'&&n===1){await page.selectOption('#lacquer-shape','box');assert.equal(await f.locator('html').getAttribute('data-step'),'2');}
    }
    await page.locator('#collect-work').click();
    await page.locator('#tab-learn').click();let correct=await page.evaluate(id=>window.CRAFTS.find(c=>c.id===id).quiz.answer,id);
    await page.locator('[data-answer="'+correct+'"]').click();assert.match(await page.locator('#quiz-feedback').innerText(),/答对/);
    await page.locator('#tab-make').click();console.log('Browser: four actions, quiz & notes — '+id);
  }
  await page.waitForFunction(()=>document.getElementById('visited-count').textContent==='6 / 6');
  for(const id of ['explode-toggle','xray-toggle','spin-toggle']){
    await page.locator('#'+id).click();await page.waitForFunction(key=>document.getElementById(key).getAttribute('aria-pressed')==='true',id);
    await page.locator('#'+id).click();
  }
  await page.locator('#zoom-in').click();await page.waitForFunction(()=>document.getElementById('zoom-reset').textContent==='110%');await page.locator('#front-view').click();
  await page.locator('#classroom').click();assert(await page.locator('body').evaluate(b=>b.classList.contains('classroom')));await page.locator('#classroom').click();
  assert(await page.locator('#lacquer-save').isEnabled());await page.locator('#lacquer-save').click();
  await page.locator('dialog[open]').waitFor();
  await mkdir(artifacts,{recursive:true});await page.screenshot({path:path.join(artifacts,'classroom-cabinet.png')});
  await page.keyboard.press('Escape');
  await page.screenshot({path:path.join(artifacts,'classroom-desktop.png')});
  await page.locator('[data-open=notebook]').first().click();const art=page.waitForEvent('download');await page.locator('#download-artwork').click();assert.match((await art).suggestedFilename(),/\.svg$/);
  await page.locator('#close-dialog').click();
  await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#craft-frame.ready').waitFor();
  assert.equal(await page.locator('#notebook-count').textContent(),'6');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile page overflows');
  await page.screenshot({path:path.join(artifacts,'classroom-mobile.png'),fullPage:true});
  await page.goto(base+'#cabinet');await page.locator('dialog[open]').waitFor();
  assert(await page.evaluate(()=>{const d=document.querySelector('dialog[open]');return d.getBoundingClientRect().right<=innerWidth+1&&d.scrollWidth<=d.clientWidth+1;}),'Mobile exhibit overflows');
  await checkCamera(page);
  assert.deepEqual(errors,[]);
  console.log('Passed desktop/mobile, workshop selection, six four-step makes, quizzes, previous notes, persistence, cabinet, classroom, view controls and exports.');
}finally{try{await browser?.close();}finally{server.closeAllConnections?.();await new Promise(resolve=>server.close(resolve));}}
