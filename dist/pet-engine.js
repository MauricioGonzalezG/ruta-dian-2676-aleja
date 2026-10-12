/* Rewards are learning milestones, never an official exam score. */
(function(root){
  const outfits=[
    {id:'none',name:'Al natural',stars:0,icon:'🐾',description:'Toby empieza contigo.'},
    {id:'scarf',name:'Pañuelo explorador',stars:1,icon:'🧣',description:'El primer examen con 80% abre este regalo.'},
    {id:'cap',name:'Gorra de estudiante',stars:4,icon:'🧢',description:'Cuatro estrellas para seguir aprendiendo.'},
    {id:'sweater',name:'Suéter de equipo',stars:8,icon:'👕',description:'Ocho estrellas y un compañero bien abrigado.'},
    {id:'crown',name:'Corona del conocimiento',stars:15,icon:'👑',description:'Quince estrellas de constancia.'}
  ];
  const initial=()=>({name:'Toby',outfit:'none',ledger:{}});
  function stats(pet){let stars=0,food=0,fed=0;for(const e of Object.values(pet?.ledger||{})){stars+=e.stars||0;food+=e.food||0;if(e.kind==='feed')fed++}return{stars:Math.max(0,stars),food:Math.max(0,food),fed}}
  function normalize(raw){const p=initial();if(!raw||typeof raw!=='object')return p;p.name=String(raw.name||'Toby').trim().slice(0,20)||'Toby';p.outfit=outfits.some(o=>o.id===raw.outfit)?raw.outfit:'none';for(const [id,e] of Object.entries(raw.ledger||{}).slice(-1500)){if(!e||typeof e!=='object'||id.length>160)continue;if(e.kind==='feed')p.ledger[id]={kind:'feed',stars:0,food:-1,at:Number(e.at)||0};else p.ledger[id]={kind:'reward',stars:Math.min(1,Math.max(0,Number(e.stars)||0)),food:Math.min(2,Math.max(0,Number(e.food)||0)),at:Number(e.at)||0}}if(outfits.find(o=>o.id===p.outfit).stars>stats(p).stars)p.outfit='none';return p}
  function award(raw,attempt){const pet=normalize(raw),before=stats(pet),unlocksBefore=outfits.filter(o=>o.stars<=before.stars).map(o=>o.id);if(!attempt||!attempt.id)return{pet,reward:{food:0,stars:0,unlocks:[]}};
    const eligible=attempt.gradedCount>0&&attempt.score>=.8;
    const completeSelfReport=attempt.mode==='likert'&&attempt.likertCount>0&&attempt.likertAnswered===attempt.likertCount;
    const at=attempt.finished||Date.now();
    if(eligible||completeSelfReport){const key='food:'+attempt.id;if(!pet.ledger[key])pet.ledger[key]={kind:'reward',stars:0,food:eligible&&attempt.score===1?2:1,at}}
    if(eligible){const milestone='milestone:'+attempt.mode+':'+(attempt.ref||'all');if(!pet.ledger[milestone])pet.ledger[milestone]={kind:'reward',stars:1,food:0,at};if(attempt.score===1){const perfect='perfect:'+attempt.mode+':'+(attempt.ref||'all');if(!pet.ledger[perfect])pet.ledger[perfect]={kind:'reward',stars:1,food:0,at}}}
    const after=stats(pet);return{pet,reward:{food:after.food-before.food,stars:after.stars-before.stars,unlocks:outfits.filter(o=>o.stars<=after.stars&&!unlocksBefore.includes(o.id)).map(o=>o.id)}};
  }
  function feed(raw,id){const pet=normalize(raw);if(stats(pet).food<1)return{pet,ok:false};if(pet.ledger[id])return{pet,ok:false};pet.ledger[id]={kind:'feed',stars:0,food:-1,at:Date.now()};return{pet,ok:true}}
  function reconcile(raw,attempts){let pet=normalize(raw);for(const a of attempts||[])pet=award(pet,a).pet;return pet}
  root.RutaRewards={initial,normalize,stats,award,feed,reconcile,outfits};
})(typeof window!=='undefined'?window:globalThis);
