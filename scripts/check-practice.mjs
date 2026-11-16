import assert from 'node:assert/strict';

const ids = ['jin','xiu','bamboo','print','lantern','lacquer'];

async function dragTrace(page, instrument) {
  const svg = instrument.locator('.trace-pad svg');
  await svg.scrollIntoViewIfNeeded();
  const points = await svg.evaluate(el => Array.from(el.querySelectorAll('.trace-mark'), mark => {
    const local = new DOMPoint(mark.cx.baseVal.value, mark.cy.baseVal.value);
    const {x,y} = local.matrixTransform(el.getScreenCTM());
    return {x,y};
  }));
  assert(points.length >= 2);
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  try {
    for (const {x,y} of points.slice(1)) await page.mouse.move(x,y,{steps:4});
  } finally {
    await page.mouse.up();
  }
}

async function checkStudy(page, parts) {
  await page.locator('#study-parts').click();
  const frame = page.frameLocator('#study-content iframe');
  await frame.locator('html[data-ready="true"]').waitFor({state:'attached'});
  const slider = page.locator('.explode-slider input');
  await slider.press('End');
  await page.waitForFunction(() => document.querySelector('#study-content iframe').contentWindow.heritageUI.st.explode === 1);
  const expanded = await frame.locator('#art').innerHTML();
  await slider.press('Home');
  await page.waitForFunction(() => document.querySelector('#study-content iframe').contentWindow.heritageUI.st.explode === 0);
  assert.notEqual(await frame.locator('#art').innerHTML(), expanded, 'The explosion slider must change the drawing');
  await slider.press('End');
  const tags = frame.locator('#fig .tag[data-t]');
  await tags.first().waitFor({state:'visible'});
  const names = await tags.evaluateAll(elements => elements.map(el => el.dataset.t));
  const visibleParts = parts.filter(part => names.includes(part.tag || part.name));
  assert(visibleParts.length >= 2, 'Expected at least two matching model labels at this angle');
  const [first, second] = visibleParts;
  const pick = page.locator('.part-picks').getByRole('button',{name:second.name,exact:true});
  await pick.click();
  assert.equal(await page.locator('.part-description').innerText(), second.detail);
  await frame.locator('.tag.study-picked[data-t="'+(second.tag || second.name)+'"]').waitFor({state:'visible'});
  await frame.locator('.tag[data-t="'+(first.tag || first.name)+'"] text').last().click();
  await page.waitForFunction(name => document.querySelector('.part-picks [aria-pressed="true"]')?.textContent === name,first.name);
  assert.equal(await page.locator('.part-description').innerText(), first.detail);
  await page.locator('#study-close').click();
}

async function checkComparison(page) {
  await page.locator('#study-compare').click();
  const columns = page.locator('.comparison-item');
  for (const [side, step] of [[0,1],[1,3]]) {
    await columns.nth(side).locator('select').selectOption(String(step));
    await page.waitForFunction(({side, step}) => {
      const el = document.querySelectorAll('.comparison-item iframe')[side];
      return el.contentDocument?.documentElement.dataset.step === String(step);
    }, {side,step});
  }
  for (const side of [0,1]) {
    const before = await columns.nth(side).locator('iframe').evaluate(el => el.contentWindow.heritagePose());
    const svg = columns.nth(side).frameLocator('iframe').locator('#fig');
    await svg.scrollIntoViewIfNeeded();
    const box = await svg.boundingBox();
    assert(box);
    const x = box.x + box.width * .32, y = box.y + box.height * .55;
    await page.mouse.move(x,y);
    await page.mouse.down();
    try { await page.mouse.move(x + 52,y - 16,{steps:7}); }
    finally { await page.mouse.up(); }
    await page.waitForFunction(({side,before}) => {
      const poses = Array.from(document.querySelectorAll('.comparison-item iframe'), el => el.contentWindow.heritagePose());
      return Math.abs(poses[side].yaw-before.yaw) > 2 &&
        Math.abs(poses[0].yaw-poses[1].yaw) < .2 && Math.abs(poses[0].pitch-poses[1].pitch) < .2;
    },{side,before});
  }
  await page.locator('#study-close').click();
}

async function useInstrument(page, body, op, useMouse) {
  const instrument = body.locator('.practice-instrument');
  const next = body.locator('.practice-next');
  assert(await next.isDisabled(), 'Each operation starts locked');
  switch (op.type) {
    case 'trace':
      if (useMouse) await dragTrace(page,instrument);
      else {
        for (let i=1; i<op.points.length; i++) await instrument.locator('.instrument-step').click();
      }
      break;
    case 'range': {
      const slider = instrument.locator('input[type="range"]');
      await slider.focus();
      if (op.target[0] === op.max) await slider.press('End');
      else {
        const target = (op.target[0]+op.target[1])/2;
        const ratio = (target-op.min)/(op.max-op.min);
        await slider.scrollIntoViewIfNeeded();
        const box = await slider.boundingBox();
        await slider.click({position:{x:box.width*ratio,y:box.height/2}});
      }
      const value = Number(await slider.inputValue());
      assert(value >= op.target[0] && value <= op.target[1], op.prompt+' slider value '+value);
      break;
    }
    case 'sequence':
    case 'choice': {
      const choices = instrument.locator('.practice-choices button');
      const order = op.type === 'choice' ? [op.answer] : op.order;
      await choices.nth((order[0]+1)%op.options.length).click();
      assert(await next.isDisabled(), 'An incorrect selection must keep the operation locked');
      for (const index of order) await choices.nth(index).click();
      break;
    }
    default: throw Error('Unknown classroom control '+op.type);
  }
  assert(await next.isEnabled(), op.prompt+' should unlock after successful input');
}

export async function checkPractice(page, base) {
  await page.goto(base);
  await page.locator('[data-open="workshop"]').first().click();
  const body = page.locator('#practice-body');
  let committed = 0;
  for (const id of ids) {
    await page.locator('a.craft-link[href="#'+id+'"]').click();
    await page.waitForFunction(id => document.querySelector('#craft-frame.ready')?.contentWindow?.heritageId === id,id);
    const lesson = await page.evaluate(id => window.ShuLessons[id],id);
    assert.equal(lesson.stages.length,4);
    await checkComparison(page);
    let dragged = false;
    for (const [stage, step] of lesson.stages.entries()) {
      for (const [which, op] of step.operations.entries()) {
        assert.equal(await body.locator('.operation-prompt').innerText(), op.prompt);
        const byMouse = op.type === 'trace' && !dragged;
        await useInstrument(page, body, op, byMouse);
        if (byMouse) dragged = true;
        // Read the model through the same iframe used for display. A successful
        // preview can move its geometry but must not commit the stage itself.
        await page.waitForFunction(({stage,which}) => {
          const st = document.querySelector('#craft-frame').contentWindow.heritageUI.st;
          return st.step === stage && st.manualPractice?.stage === stage && st.manualPractice.operation === which;
        },{stage,which});
        await body.locator('.practice-next').click();
      }
      await page.waitForFunction(n => {
        const dataset = document.querySelector('#craft-frame').contentDocument.documentElement.dataset;
        return dataset.step === String(n) && Number(dataset.progress) === n/4 &&
          document.querySelectorAll('#process-list li.complete').length === n;
      },stage+1);
      committed++;
    }
    assert(dragged, 'Expect at least one physical drag in '+id);
    await body.locator('.practice-finished').waitFor();
    assert.equal(await page.frameLocator('#craft-frame').locator('html').getAttribute('data-done'),'true');
    assert.equal(await page.locator('#progress-number').innerText(),'100%');
    console.log('Browser: completed all four manual stages and both comparison views — '+id);
  }
  assert.equal(committed,24);
  for (const id of ids) {
    await page.locator('a.craft-link[href="#'+id+'"]').click();
    await page.waitForFunction(id => document.querySelector('#craft-frame.ready')?.contentWindow?.heritageId === id,id);
    await checkStudy(page,await page.evaluate(id => window.ShuLessons[id].parts,id));
    console.log('Browser: inspected exploded model and selected labels from both list and model — '+id);
  }
}
