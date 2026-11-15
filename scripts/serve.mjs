import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const option = process.argv.indexOf('--base-path');
const basePath = option < 0 ? '/' : process.argv[option+1];
if (!basePath || !/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(basePath)) throw Error('Use a base path such as /shu-craft-lab/');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.png':'image/png','.txt':'text/plain; charset=utf-8'};
const server = http.createServer((req,res)=>{
  let file;
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (basePath !== '/' && pathname === basePath.slice(0,-1)) { res.writeHead(301,{Location:basePath});return res.end(); }
    if (!pathname.startsWith(basePath)) {res.writeHead(404);return res.end('Not found');}
    file = path.resolve(root,pathname.slice(basePath.length) || 'index.html');
    if (file !== root && !file.startsWith(root+path.sep)) throw Error();
    if (fs.existsSync(file)&&fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
  } catch {res.writeHead(400);return res.end('Bad request');}
  fs.readFile(file,(err,data)=>{ if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data); });
});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'+basePath));
