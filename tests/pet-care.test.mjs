import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const ctx=vm.createContext({window:{},Date,Math,Set,Object,String,Number,Array});
vm.runInContext(await readFile(new URL('../dist/pet-engine.js',import.meta.url),'utf8'),ctx);
const R=ctx.window.RutaRewards,DAY=86400000,T=Date.parse('2026-10-15T15:00:00Z');

test('old pets start healthy without losing earned meals, clothes or stars',()=>{
  const legacy={name:'Luna',outfit:'scarf',ledger:{old:{kind:'reward',stars:1,food:2,at:T-DAY}}};
  const pet=R.normalize(legacy,T),status=R.care(pet,T);
  assert.equal(pet.name,'Luna');assert.equal(pet.outfit,'scarf');assert.equal(R.stats(pet).food,2);assert.equal(status.health,80);
  assert.equal(R.normalize(JSON.parse(JSON.stringify(pet)),T+DAY).care.startedAt,T);
});
test('wellbeing decays while away, remains recoverable, and eating uses saved food',()=>{
  let pet=R.initial(T),c=R.care(pet,T+DAY);
  assert.deepEqual([c.nutrition,c.mood,c.energy,c.health],[68,70,72,70]);
  c=R.care(pet,T+100*DAY);assert.deepEqual([c.nutrition,c.mood,c.energy],[20,20,20]);
  pet=R.task(pet,'study',T+100*DAY).pet;
  const fed=R.feed(pet,'feed:test',T+100*DAY);assert.equal(fed.ok,true);
  c=R.care(fed.pet,T+100*DAY);assert.deepEqual([c.nutrition,c.mood,c.energy],[50,28,25]);assert.equal(R.stats(fed.pet).food,0);
  assert.equal(R.feed(fed.pet,'feed:test',T+100*DAY).ok,false);
});
test('daily tasks reward once, reset at Colombian midnight, and keep unspent food',()=>{
  const beforeMidnight=Date.parse('2026-10-16T04:59:59Z'),afterMidnight=beforeMidnight+2000;
  let p=R.initial(T);p=R.task(p,'study',beforeMidnight).pet;
  assert.equal(R.task(p,'study',beforeMidnight).ok,false);
  p=R.task(p,'practice',beforeMidnight).pet;
  assert.equal(R.care(p,beforeMidnight).tasks,2);assert.equal(R.care(p,beforeMidnight).games,2);assert.equal(R.stats(p).food,2);
  let c=R.care(p,afterMidnight);assert.equal(c.day,'2026-10-16');assert.equal(c.tasks,0);assert.equal(c.games,0);assert.equal(R.stats(p).food,2);
  p=R.task(p,'study',afterMidnight).pet;assert.equal(R.stats(p).food,3);
});
test('playing spends a daily game; rest restores energy once; no care softlock',()=>{
  let p=R.initial(T);assert.equal(R.interact(p,'play',T).reason,'tasks');
  p=R.task(p,'study',T+10*DAY).pet;
  assert.equal(R.interact(p,'play',T+10*DAY).reason,'energy');
  p=R.interact(p,'rest',T+10*DAY).pet;
  assert.equal(R.care(p,T+10*DAY).energy,50);
  assert.equal(R.interact(p,'rest',T+10*DAY).reason,'rested');
  p=R.interact(p,'play',T+10*DAY).pet;
  assert.equal(R.care(p,T+10*DAY).games,0);assert.equal(R.care(p,T+10*DAY).mood,45);assert.equal(R.care(p,T+10*DAY).energy,40);
  assert.equal(R.interact(p,'play',T+10*DAY).ok,false);
});
test('backup and offline merge preserve care and never double the same daily gift or game',()=>{
  const start=R.initial(T),local=R.task(start,'study',T+1000).pet,remote=R.task(start,'study',T+2000).pet;
  const a=R.interact(local,'play',T+3000).pet,b=R.interact(remote,'play',T+4000).pet;
  const merged=R.merge(a,b,T+5000),reverse=R.merge(b,a,T+5000);
  assert.equal(R.stats(merged).food,1);assert.equal(R.care(merged,T+5000).gamesUsed,1);
  assert.equal(R.care(merged,T+5000).mood,R.care(reverse,T+5000).mood);
  const restored=R.normalize(JSON.parse(JSON.stringify(merged)),T+5000);
  assert.equal(restored.care.events['play:2026-10-15:1'].at,T+3000);
  assert.equal(R.care(restored,T+5000).games,0);
});
test('future timestamps, unknown care events and wrong date IDs cannot replenish health',()=>{
  const p=R.initial(T);
  p.care.events={'rest:2026-10-15':{kind:'rest',at:T+DAY},'rest:2026-10-14':{kind:'rest',at:T},'hack':{kind:'magic',at:T}};
  const clean=R.normalize(p,T);assert.equal(Object.keys(clean.care.events).length,0);assert.equal(R.care(clean,T).health,80);
});
