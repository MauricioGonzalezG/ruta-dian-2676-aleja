// Disposable, local UI rehearsal. No Turso request or real account is created.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createClient} from '@libsql/client';
import {migrate} from '../server/database.mjs';
import {handleApi} from '../server/api.mjs';
const port=4180,origin='http://127.0.0.1:'+port,db=createClient({url:':memory:'});await migrate(db);
const env={TURSO_DATABASE_URL:'libsql://example.invalid',TURSO_AUTH_TOKEN:'test-only',AUTH_SECRET:'local-browser-test-secret-not-for-deployment',APP_ORIGIN:origin};
const types={js:'text/javascript',css:'text/css',json:'application/json',html:'text/html',svg:'image/svg+xml'};
http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,origin);
  if(url.pathname.startsWith('/api/')){
    let chunks=[];for await(const c of req)chunks.push(c);const response=await handleApi(new Request(url,{method:req.method,headers:req.headers,body:req.method==='GET'?undefined:Buffer.concat(chunks)}),env,{db});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;
  }
  const relative=url.pathname==='/'?'index.html':url.pathname.slice(1);if(relative.includes('..'))throw Error('invalid path');const data=await readFile(new URL('../dist/'+relative,import.meta.url));res.writeHead(200,{'Content-Type':types[relative.split('.').at(-1)]||'application/octet-stream'});res.end(data);
}catch{res.writeHead(404);res.end('Not found')}}).listen(port,'127.0.0.1',()=>console.log('Test-only local: '+origin));
