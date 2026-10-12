import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@libsql/client';
import { handleApi,verifyPassword } from '../server/api.mjs';
import { migrate } from '../server/database.mjs';

const origin='https://study.example.test';
const env={TURSO_DATABASE_URL:'libsql://example.invalid',TURSO_AUTH_TOKEN:'test-only',AUTH_SECRET:'test-secret-for-isolated-tests-32-characters',APP_ORIGIN:origin};
const state=()=>({version:1,pace:15,lessons:{oficina:{read:true,best:1,checks:[],reviewAt:0}},stages:{},attempts:[],errors:{},daily:{},active:null,priorities:{oficina:2},priorityEnabled:true,pet:{name:'Toby',outfit:'none',ledger:{}}});
function request(path,{method='GET',body,cookie,headers={}}={}){return new Request(origin+path,{method,headers:{...(body?{'Content-Type':'application/json','Origin':origin,'X-Ruta-Client':'web'}:{}),...(cookie?{'Cookie':cookie}:{}),...headers},body:body?JSON.stringify(body):undefined})}
const payload=async response=>({status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')});

test('no environment or partial environment keeps browser mode and disables auth',async()=>{
  for(const conf of [{},{TURSO_DATABASE_URL:'libsql://example.invalid'},{...env,AUTH_SECRET:'short'}]){
    const cfg=await payload(await handleApi(request('/api/config'),conf));assert.equal(cfg.status,200);assert.equal(cfg.data.accountsEnabled,false);
    const auth=await handleApi(request('/api/auth/register',{method:'POST',body:{}}),conf);assert.equal(auth.status,503);
  }
});

test('configured API: secure credentials, sessions, isolated progress and conflict detection',async t=>{
  const db=createClient({url:':memory:'});await migrate(db);const call=async(p,o)=>payload(await handleApi(request(p,o),env,{db}));
  let cookieA,cookieB;
  await t.test('registration hashes passwords and stores only session hashes',async()=>{
    const response=await call('/api/auth/register',{method:'POST',body:{email:'Alice@example.test',password:'good-test-password',name:'Alice'}});assert.equal(response.status,201);assert.equal(response.data.user.email,'alice@example.test');cookieA=response.cookie.split(';')[0];
    assert(response.cookie.includes('HttpOnly'));assert(response.cookie.includes('SameSite=Strict'));assert(response.cookie.includes('Secure'));
    const user=(await db.execute('SELECT * FROM users')).rows[0];assert(!user.password_hash.includes('good-test-password'));assert(await verifyPassword('good-test-password',user.password_hash));
    const session=(await db.execute('SELECT * FROM sessions')).rows[0];assert.notEqual(session.token_hash,cookieA.split('=')[1]);
    const bob=await call('/api/auth/register',{method:'POST',body:{email:'bob@example.test',password:'another-test-password',name:'Bob'}});assert.equal(bob.status,201);cookieB=bob.cookie.split(';')[0];
  });
  await t.test('CSRF and anonymous writes rejected',async()=>{
    assert.equal((await call('/api/progress',{method:'PUT',body:{state:state(),revision:0},headers:{Origin:'https://attacker.invalid'},cookie:cookieA})).status,403);
    assert.equal((await call('/api/progress',{method:'PUT',body:{state:state(),revision:0},headers:{'X-Ruta-Client':''},cookie:cookieA})).status,403);
    assert.equal((await call('/api/progress',{method:'PUT',body:{state:state(),revision:0}})).status,401);
  });
  await t.test('one account cannot read or overwrite another account',async()=>{
    const first=await call('/api/progress',{method:'PUT',body:{state:state(),revision:0,userId:'another-user'},cookie:cookieA});assert.equal(first.status,200);assert.equal(first.data.revision,1);
    const a=await call('/api/progress',{cookie:cookieA});assert.equal(a.data.state.pet.name,'Toby');assert.equal(a.data.state.priorities.oficina,2);
    const b=await call('/api/progress?userId='+encodeURIComponent((await call('/api/auth/me',{cookie:cookieA})).data.user.id),{cookie:cookieB});assert.equal(b.data.state,null);assert.equal(b.data.revision,0);
    const bobState=state();bobState.pet.name='Luna';assert.equal((await call('/api/progress',{method:'PUT',body:{state:bobState,revision:0},cookie:cookieB})).status,200);assert.equal((await call('/api/progress',{cookie:cookieA})).data.state.pet.name,'Toby');
  });
  await t.test('optimistic revisions protect newer data',async()=>{
    const stale=await call('/api/progress',{method:'PUT',body:{state:state(),revision:0},cookie:cookieA});assert.equal(stale.status,409);assert.equal(stale.data.code,'REVISION_CONFLICT');assert.equal(stale.data.revision,1);
    const updated=state();updated.pet.name='Toby II';const result=await call('/api/progress',{method:'PUT',body:{state:updated,revision:1},cookie:cookieA});assert.equal(result.status,200);assert.equal(result.data.revision,2);
  });
  await t.test('wrong credentials and expired/revoked sessions fail',async()=>{
    assert.equal((await call('/api/auth/login',{method:'POST',body:{email:'alice@example.test',password:'wrong-test-password'}})).status,401);
    assert.equal((await call('/api/auth/login',{method:'POST',body:{email:"a'OR'1'='1'--@example.test",password:'good-test-password'}})).status,401);
    const login=await call('/api/auth/login',{method:'POST',body:{email:'alice@example.test',password:'good-test-password'}});assert.equal(login.status,200);
    const logout=await call('/api/auth/logout',{method:'POST',body:{},cookie:cookieA});assert.equal(logout.status,200);assert(logout.cookie.includes('Max-Age=0'));assert.equal((await call('/api/auth/me',{cookie:cookieA})).data.user,null);
    await db.execute('UPDATE sessions SET expires_at=0');assert.equal((await call('/api/progress',{cookie:cookieB})).status,401);
  });
  await t.test('rate limit is durable and independent of forwarded IP',async()=>{
    for(let i=0;i<12;i++)await call('/api/auth/login',{method:'POST',body:{email:'limited@example.test',password:'nonexistent-password'},headers:{'X-Forwarded-For':String(i)}});
    assert.equal((await call('/api/auth/login',{method:'POST',body:{email:'limited@example.test',password:'nonexistent-password'},headers:{'X-Forwarded-For':'changed'}})).status,429);
  });
  db.close();
});
