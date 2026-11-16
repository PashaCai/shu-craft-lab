// Browser integration of offline photography, image import and camera teardown.
import assert from 'node:assert/strict';
export async function checkCamera(page){
  const cab=page.locator('#lacquer-cabinet');
  const close=async()=>{await cab.locator('.lc-close').click();await cab.waitFor({state:'hidden'});};
  await close();
  const fixture=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=240;canvas.height=200;
    const draw=()=>{const c=canvas.getContext('2d');c.fillStyle='#f8f6f1';c.fillRect(0,0,240,200);
      c.fillStyle='#963a32';c.beginPath();c.moveTo(97,24);c.lineTo(142,24);c.lineTo(140,63);
      c.bezierCurveTo(176,79,184,141,148,173);c.lineTo(94,173);c.bezierCurveTo(56,141,65,83,99,63);c.fill();
      c.fillStyle='#dbaf60';c.fillRect(84,110,72,7);};
    draw();window.qaTracks=[];
    Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:async constraints=>{
      if(constraints.audio!==false)throw Error('unexpected audio request');
      const stream=canvas.captureStream(12);window.qaTracks.push(...stream.getTracks());setTimeout(draw,35);return stream;
    }});
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#open-camera').click();await cab.locator('[data-do=shutter]').click();
  const form=cab.locator('form');await form.waitFor();
  assert(await page.evaluate(()=>window.qaTracks.length===1&&window.qaTracks[0].readyState==='ended'),'Capture must stop the video track');
  assert.equal(await form.locator('[name=shape]').inputValue(),'vase');
  await form.locator('[name=name]').fill('实拍测试·朱漆瓶');await form.locator('[type=submit]').click();
  const key='shu-craft.lacquer-cabinet.v1',read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  let items=await read(),shot=items.find(x=>x.name==='实拍测试·朱漆瓶');assert(shot&&shot.source==='camera');
  assert.equal(shot.profile.length,12);assert(shot.profile[10]<shot.profile[4]*.85);
  assert.match(shot.color,/^#9[0-9a-f]3[0-9a-f]3[0-9a-f]$/i);assert.notEqual(shot.color,shot.accent);
  assert(!JSON.stringify(items).includes('data:image'),'Raw photo leaked into cabinet storage');
  const viewer=cab.locator('iframe.lc-model');await viewer.contentFrame().locator('html[data-ready=true]').waitFor();
  const u=new URL(await viewer.getAttribute('src'),page.url());assert.equal(u.searchParams.get('profile'),shot.profile.join(','));
  await cab.locator('[data-do=spin]').click();await page.waitForFunction(()=>document.querySelector('#lacquer-cabinet [data-do=spin]')?.getAttribute('aria-pressed')==='true');
  await close();
  await page.locator('#open-camera').click();await cab.locator('[data-do=shutter]').waitFor();await close();
  assert(await page.evaluate(()=>window.qaTracks.every(t=>t.readyState==='ended')),'Closing must release the camera');
  await page.evaluate(()=>Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:async()=>{throw new DOMException('denied','NotAllowedError');}}));
  await page.locator('#open-camera').click();await page.waitForFunction(()=>document.querySelector('#lacquer-cabinet [data-status]')?.textContent.includes('未获得'));
  await cab.locator('input[type=file]').setInputFiles({name:'example-lacquer.png',mimeType:'image/png',buffer:Buffer.from(fixture,'base64')});
  await form.waitFor();await form.locator('[name=name]').fill('相册测试');await form.locator('[type=submit]').click();
  await cab.locator('.lc-caption h3').filter({hasText:'相册测试'}).waitFor();
  items=await read();assert.equal(items.filter(x=>x.source==='camera').length,2);assert(items.some(x=>x.source==='workshop'));
  await page.reload();await page.locator('#lacquer-cabinet[open]').waitFor();
  assert.equal((await read()).length,items.length);
  console.log('Browser: simulated shutter, image-derived shape/profile/colors, camera stops, denied permission, file fallback, exhibit spin, multiple pieces and persistence.');
}
