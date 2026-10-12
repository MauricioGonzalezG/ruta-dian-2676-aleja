import test from 'node:test';
import assert from 'node:assert/strict';
import {vercelRequest} from '../server/vercel-adapter.mjs';
test('Vercel rewrite keeps route, origin, JSON body and cookies',async()=>{
  const request=vercelRequest({url:'/api?route=auth/login',query:{route:'auth/login'},method:'POST',body:{email:'test@example.test',password:'test-only-password'},headers:{host:'app.vercel.app',origin:'https://app.vercel.app','content-type':'application/json','x-ruta-client':'web',cookie:'ruta_session=test-only'}});
  assert.equal(request.url,'https://app.vercel.app/api/auth/login');assert.equal(request.headers.get('origin'),'https://app.vercel.app');assert.equal(request.headers.get('cookie'),'ruta_session=test-only');assert.equal((await request.json()).email,'test@example.test');
  const get=vercelRequest({url:'/api?route=config',method:'GET',headers:{host:'app.vercel.app'}});assert.equal(get.url,'https://app.vercel.app/api/config');assert.equal(get.body,null);
});
