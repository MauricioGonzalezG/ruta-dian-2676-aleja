import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

test('cloud saves are queued even when local storage is unavailable',async()=>{
  let queued=false;
  const ctx=vm.createContext({window:{addEventListener(){}},document:{addEventListener(){},querySelectorAll(){return []}},Date,Math,Set,Map,Object,String,Number,Array,JSON,localStorage:{setItem(){throw Error('storage disabled')}},setInterval(){return 1},setTimeout(){queued=true;return 1},clearTimeout(){}});
  for(const script of ['pet-engine.js','features.js'])vm.runInContext(await readFile(new URL('../dist/'+script,import.meta.url),'utf8'),ctx);
  const extras=ctx.window.RutaExtras;extras.cloud.enabled=true;extras.cloud.user={id:'test-user'};extras.cloud.status='synced';
  assert.doesNotThrow(()=>extras.persist({version:1,lessons:{},attempts:[]}));assert.equal(queued,true);assert.equal(extras.cloud.status,'pending');
  extras.cloud.user=null;assert.throws(()=>extras.persist({version:1,lessons:{},attempts:[],pace:30}));
});
