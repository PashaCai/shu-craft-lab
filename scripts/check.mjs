import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { checkSceneFlows } from './check-scenes.mjs';

const project=fileURLToPath(new URL('../',import.meta.url));
const root=path.join(project,'dist');
function walk(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)]);}
const files=walk(root),names=new Set(files.map(file=>path.relative(root,file).split(path.sep).join('/')));
let scripts=0,references=0;
function localReference(file,reference){
  if(!reference||/^(?:#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference))return;
  if(reference.startsWith('/'))throw Error('Root-relative URL breaks GitHub project Pages: '+reference);
  const local=decodeURIComponent(reference.split(/[?#]/)[0]);
  const resolved=path.resolve(path.dirname(file),local);
  const exact=path.relative(root,resolved).split(path.sep).join('/');
  if(!names.has(exact))throw Error(`Missing resource or incorrect filename case in ${path.relative(root,file)}: ${reference}`);
  references++;
}
for(const file of files){
  const source=fs.readFileSync(file,'utf8');
  if(file.endsWith('.js')){new vm.Script(source,{filename:file});scripts++;}
  if(file.endsWith('.html')){
    for(const [,attrs,body] of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
      if(body.trim()){new vm.Script(body,{filename:file});scripts++;}
    }
    for(const [,quote,ref] of source.matchAll(/\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi))localReference(file,ref);
  }
  if(file.endsWith('.css'))for(const match of source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi))localReference(file,match[1]??match[2]??match[3]);
}
for(const file of walk(path.join(project,'scripts')).filter(file=>file.endsWith('.mjs'))){
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status!==0)throw Error(result.stderr||'Script syntax failed: '+file);
}
const content={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/content.js'),'utf8'),content);
const ids=['jin','xiu','bamboo','print','lantern'];
if(content.window.CRAFTS.length!==5)throw Error('Expected five craft lessons');
for(const id of ids){
  const lesson=content.window.CRAFTS.find(c=>c.id===id);
  if(!lesson||lesson.steps.length!==4||!lesson.quiz.options[lesson.quiz.answer])throw Error('Invalid lesson: '+id);
  const html=fs.readFileSync(path.join(root,'figures',id+'.html'),'utf8');
  if(!html.includes('heritageUI')||!html.includes('figure-bridge.js'))throw Error('Scene integration missing: '+id);
}
checkSceneFlows(project,ids);
console.log(`Passed: ${files.length} website files, ${scripts} browser JavaScript programs, ${references} case-sensitive local references, Node scripts and five scene integrations.`);
