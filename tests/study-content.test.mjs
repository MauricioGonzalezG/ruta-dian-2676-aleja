import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const root=new URL('../dist/',import.meta.url);
const load=async name=>JSON.parse((await readFile(new URL(name,root),'utf8')).replace(/^\uFEFF/,''));
const [functional,behavioral,data]=await Promise.all(['functional.json','behavioral.json','technical.json'].map(load));
const base=[...functional,...behavioral];
const context=vm.createContext({window:{},String,Object,Array,Set});
vm.runInContext(await readFile(new URL('study-engine.js',root),'utf8'),context);
const study=context.window.RutaStudy;
const lessons=study.enrichLessons(base,data);

test('technical material covers all indicators with primary references and developed cases',()=>{
  assert.equal(lessons.length,22);assert.equal(Object.keys(data.lessons).length,22);
  const sources=new Map(data.sources.map(s=>[s.id,s]));assert.equal(sources.size,data.sources.length);assert(sources.size>=30);
  const ids=new Set();let total=0;
  for(const source of sources.values()){
    const url=new URL(source.url);assert.equal(url.protocol,'https:');
    assert(/(^|\.)(dian\.gov\.co|funcionpublica\.gov\.co|cancilleria\.gov\.co|archivogeneral\.gov\.co|mintic\.gov\.co|microsoft\.com)$/.test(url.hostname),url.hostname);
    assert(source.rule&&source.reference&&source.application&&source.distinction);
    assert(source.lessons.every(id=>base.some(l=>l.id===id)));
  }
  for(const l of lessons){
    assert(l.technical.sections.length>=3);assert.equal(l.objectives.length,6);
    for(const q of l.questions){
      assert(!ids.has(q.id));ids.add(q.id);assert(q.id.startsWith('v20261015-'));assert(q.case.split(/\s+/).length>=60,q.id);assert(q.prompt.includes('¿'));
      assert.equal(q.options.length,3);assert(q.answer>=0&&q.answer<3);assert(q.explanation&&q.source&&q.reference);
      if(functional.some(f=>f.id===l.id))assert.equal(q.optionExplanations.length,3,q.id);
      if(q.sourceId)assert(sources.has(q.sourceId),q.sourceId);total++;
    }
  }
  assert.equal(total,145);assert.equal(data.cutoff,'2026-06-19');
});

test('original question IDs and keys remain immutable for historical attempts',()=>{
  for(const l of lessons){const original=base.find(b=>b.id===l.id);assert.deepEqual(l.legacyQuestions,original.questions);assert(l.questions.every(q=>!original.questions.some(old=>old.id===q.id)));}
  assert.equal(behavioral.reduce((n,l)=>n+l.likert.length,0),30);
  assert(behavioral.flatMap(l=>l.likert).every(q=>!('answer' in q)));
});

test('normative search handles articles, concepts, accents and indicator filtering',()=>{
  assert(study.filterSources(data.sources,'1755').some(s=>s.id==='ley1755'));
  assert(study.filterSources(data.sources,'555-2').some(s=>s.id==='et_rut_nit'));
  assert(study.filterSources(data.sources,'constitucion').some(s=>s.id==='constitucion_garantias'));
  assert(study.filterSources(data.sources,'TVD','trd').length>0);
  assert(study.filterSources(data.sources,'TVD','trd').every(s=>s.lessons.includes('trd')));
  assert(study.filterSources(data.sources,'preservación a largo plazo').some(s=>s.id==='decreto1080'));
  assert(study.searchableLesson(lessons.find(l=>l.id==='dian'),data).includes('338'));
});
