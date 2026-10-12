import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const context=vm.createContext({window:{},Date,Math,Set,Object,String,Number,Array});vm.runInContext(await readFile(new URL('../dist/pet-engine.js',import.meta.url),'utf8'),context);const R=context.window.RutaRewards;
const attempt=(id,score=1,mode='lesson',ref='oficina')=>({id,score,mode,ref,gradedCount:6,finished:1,likertCount:0,likertAnswered:0});
test('passed exams give food, milestone stars and clothing without duplicate rewards',()=>{
  let a=R.award(R.initial(),attempt('a1'));assert.equal(a.reward.stars,2);assert.equal(a.reward.food,2);assert(a.reward.unlocks.includes('scarf'));
  let duplicate=R.award(a.pet,attempt('a1'));assert.equal(duplicate.reward.stars,0);assert.equal(duplicate.reward.food,0);
  let repeat=R.award(a.pet,attempt('a2'));assert.equal(repeat.reward.stars,0);assert.equal(repeat.reward.food,2);
  let next=R.award(repeat.pet,attempt('a3',1,'lesson','documental'));assert(next.reward.unlocks.includes('cap'));
});
test('low results and unanswered Likert are not treated as achievements',()=>{
  assert.equal(R.stats(R.award(R.initial(),attempt('bad',.5)).pet).stars,0);
  const complete={...attempt('self',0,'likert',''),gradedCount:0,likertCount:12,likertAnswered:12};const result=R.award(R.initial(),complete);assert.equal(result.reward.stars,0);assert.equal(result.reward.food,1);
  assert.equal(R.award(R.initial(),{...complete,likertAnswered:11}).reward.food,0);
});
test('feeding consumes one earned meal and survives backup normalization',()=>{
  const pet=R.award(R.initial(),attempt('meal')).pet;let fed=R.feed(pet,'feed:a');assert(fed.ok);assert.equal(R.stats(fed.pet).food,1);assert.equal(R.stats(fed.pet).fed,1);
  assert(!R.feed(fed.pet,'feed:a').ok);assert.equal(R.stats(R.normalize(JSON.parse(JSON.stringify(fed.pet)))).food,1);
});
