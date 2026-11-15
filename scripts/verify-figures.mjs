// QA only. Run "node scripts/verify-figures.mjs xiu lantern" from any directory.
// Without scene names, all five scenes are rendered. Add "--out-dir <dir>" to
// override qa/. Install sharp locally, or use the bundled Codex Node/Sharp runtime.
// This contact sheet tests the actual scene geometry, camera, and painter ordering.
// Browser integration, choreography and the optional wobble filter are tested separately.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(import.meta.url);
const project = path.resolve(path.dirname(script), '..');
const figures = new Map([
  ['jin', 'Shu brocade loom'], ['xiu', 'Shu embroidery'],
  ['bamboo', 'Daoming bamboo basket'], ['lantern', 'Zigong lotus lantern'],
  ['print', 'Mianzhu woodblock print'],
]);
const angles = [[45, 35.264], [110, 35.264], [170, 35.264], [230, 35.264],
  [300, 35.264], [20, 62], [200, 70]];
const cellWidth = 640, cellHeight = 480, titleHeight = 62, labelHeight = 38;

function options(args) {
  let outDir = path.join(project, 'qa');
  const selected = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--out-dir') {
      if (!args[index + 1] || args[index + 1].startsWith('--')) throw Error('Missing output directory');
      outDir = path.resolve(args[++index]);
    } else if (figures.has(arg)) {
      if (!selected.includes(arg)) selected.push(arg);
    } else {
      throw Error('Unknown scene or option: ' + arg);
    }
  }
  return { selected: selected.length ? selected : [...figures.keys()], outDir };
}

function loadSharp() {
  const require = createRequire(import.meta.url);
  try { return require('sharp'); } catch { /* Try the desktop runtime. */ }
  const bundled = path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node');
  const bundledPackage = path.join(bundled, 'node_modules', 'sharp');
  const bundledNode = path.join(bundled, 'bin', process.platform === 'win32' ? 'node.exe' : 'node');
  if (existsSync(bundledPackage)) {
    if (existsSync(bundledNode) && path.resolve(process.execPath) !== path.resolve(bundledNode)) {
      // Sharp is a native module: use the Node version that shipped with it.
      const result = spawnSync(bundledNode, [script, ...process.argv.slice(2)], { stdio: 'inherit' });
      if (result.error) throw result.error;
      process.exit(result.status ?? 1);
    }
    return require(bundledPackage);
  }
  throw Error('Geometry QA requires the optional sharp package or the Codex desktop runtime.');
}

// The camera is centered and sized once, exactly as mountFigure does for a
// desktop viewport. Keep projection, face sorting, materials and SVG ink in core.js.
const frameCamera = `
  const [width, depth, height] = qaConfig.size;
  RC = qaConfig.center || [width / 2, depth / 2];
  RCZ = height / 2; OX = OY = 0;
  setCam(YAW0, PITCH0);
  const corners = [];
  for (const x of [0, width]) for (const y of [0, depth]) for (const z of [0, height]) {
    corners.push(P(x, y, z));
  }
  const xs = corners.map(q => q[0]), ys = corners.map(q => q[1]);
  const xmin = Math.min(...xs), ymin = Math.min(...ys);
  const bw = Math.max(...xs) - xmin, bh = Math.max(...ys) - ymin;
  const widthVB = Math.max(bw / .74, bh / .88 / .75), heightVB = widthVB * .75;
  OX = (widthVB - bw) / 2 + widthVB * .06 - xmin;
  OY = heightVB * .04 - ymin;
  INK_K = widthVB / INK_REF_VB;
  setLight(105);
  globalThis.qaBox = { x: -widthVB * .02, y: -heightVB * .02, width: widthVB * 1.04, height: heightVB * 1.04 };
`;

async function loadFigure(name, core) {
  const viewport = { viewBox: { baseVal: {} }, getScreenCTM: () => null };
  const labels = {};
  const context = vm.createContext({
    window: { parent: {}, __ln: labels }, __ln: labels, URLSearchParams, console,
    addEventListener() {},
    document: { getElementById: id => id === 'fig' ? viewport : null },
  });
  vm.runInContext(core, context, { filename: 'core.js' });
  vm.runInContext(`
    mountFigure = config => { globalThis.qaConfig = config; return { st: config.state }; };
    xrMount = () => {};
  `, context);
  const file = path.join(project, 'dist', 'figures', name + '.html');
  const html = await fs.readFile(file, 'utf8');
  for (const [, attrs, source] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc\s*=/i.test(attrs) && source.trim()) vm.runInContext(source, context, { filename: file });
  }
  if (!context.qaConfig?.scene) throw Error('Scene registration missing: ' + name);
  vm.runInContext(frameCamera, context);
  viewport.viewBox.baseVal = context.qaBox;
  return context;
}

function banner(width, height, text, fontSize, fill) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="${fill}"/>
    <text x="18" y="${height / 2 + fontSize * .35}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="#332f26">${text}</text>
  </svg>`);
}

async function renderScene(name, context, sharp, outDir) {
  const title = figures.get(name) + '    /    Completed work    /    Top: exterior        Bottom: exploded + see-through';
  const sheetWidth = cellWidth * angles.length;
  const layers = [{ input: banner(sheetWidth, titleHeight, title, 26, '#e3d9c5'), top: 0, left: 0 }];
  const { x, y, width, height } = context.qaBox;
  const cfg = context.qaConfig;
  for (const exploded of [0, 1]) {
    cfg.params(cfg.state, new URLSearchParams({ step: '4', explode: String(exploded) }));
    Object.assign(cfg.state, { xr: exploded, xrT: exploded, pal: cfg.palette });
    if (!cfg.state.done || cfg.state.step !== 4) throw Error('Missing finished work: ' + name);
    for (const [column, [yaw, pitch]] of angles.entries()) {
      vm.runInContext(`setCam(${yaw}, ${pitch}); _clipN = 0;`, context);
      const art = vm.runInContext('inkScale(qaConfig.scene(qaConfig.state, PALS[qaConfig.palette]))', context);
      if (!art || /NaN|Infinity|undefined/.test(art)) throw Error('Invalid SVG coordinates: ' + name + ' at ' + yaw);
      const image = `<svg xmlns="http://www.w3.org/2000/svg" width="${cellWidth}" height="${cellHeight}" viewBox="${x} ${y} ${width} ${height}">
        <style>text{font-family:Microsoft YaHei,sans-serif}</style>
        <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#f3efe6"/>${art}</svg>`;
      const top = titleHeight + exploded * (cellHeight + labelHeight), left = column * cellWidth;
      layers.push({ input: await sharp(Buffer.from(image)).png().toBuffer(), top, left });
      const label = (exploded ? 'EXPLODED' : 'EXTERIOR') + '     yaw ' + yaw + '  /  pitch ' + Math.round(pitch);
      layers.push({ input: banner(cellWidth, labelHeight, label, 17, '#ded9cb'), left, top: top + cellHeight });
    }
  }
  const file = path.join(outDir, name + '-geometry-7views.png');
  const canvas = { width: sheetWidth, height: titleHeight + 2 * (cellHeight + labelHeight), channels: 3, background: '#f3efe6' };
  await sharp({ create: canvas }).composite(layers).png().toFile(file);
  console.log('14 geometry views rendered: ' + file);
}

const { selected, outDir } = options(process.argv.slice(2));
const sharp = loadSharp();
await fs.mkdir(outDir, { recursive: true });
const core = await fs.readFile(path.join(project, 'dist', 'assets', 'core.js'), 'utf8');
for (const name of selected) await renderScene(name, await loadFigure(name, core), sharp, outDir);
