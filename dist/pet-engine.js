/* Rewards are learning milestones, never an official exam score. */
(function(root){
  const outfits=[
    {id:'none',name:'Al natural',stars:0,icon:'🐾',description:'Pelaje dorado, patitas suaves y chapita con su nombre.'},
    {id:'scarf',name:'Pañuelo explorador',stars:1,icon:'🧣',description:'Tela coral con costuras, un nudo y pequeñas puntadas.'},
    {id:'cap',name:'Gorra de estudiante',stars:4,icon:'🧢',description:'Paneles azules, visera curva y detalles bordados.'},
    {id:'sweater',name:'Suéter de equipo',stars:8,icon:'👕',description:'Punto verde, cuello acanalado y una patita bordada.'},
    {id:'crown',name:'Corona del conocimiento',stars:15,icon:'👑',description:'Oro, gemas de colores y puntas redondeadas.'}
  ];
  const DAY=86400000;
  const dayKey=at=>new Date(at-5*3600000).toISOString().slice(0,10); // Colombia, UTC−5 all year.
  const initial=(now=Date.now())=>({name:'Toby',outfit:'none',ledger:{},care:{startedAt:now,events:{}}});
  function stats(pet){let stars=0,food=0,fed=0;for(const e of Object.values(pet?.ledger||{})){stars+=e.stars||0;food+=e.food||0;if(e.kind==='feed')fed++}return{stars:Math.max(0,stars),food:Math.max(0,food),fed}}
  function normalize(raw,now=Date.now()){
    const p=initial(now);if(!raw||typeof raw!=='object')return p;
    p.name=String(raw.name||'Toby').trim().slice(0,20)||'Toby';p.outfit=outfits.some(o=>o.id===raw.outfit)?raw.outfit:'none';
    for(const [id,e] of Object.entries(raw.ledger||{})){if(!e||typeof e!=='object'||id.length>160)continue;if(e.kind==='feed')p.ledger[id]={kind:'feed',stars:0,food:-1,at:Number(e.at)||0};else p.ledger[id]={kind:'reward',stars:Math.min(1,Math.max(0,Number(e.stars)||0)),food:Math.min(2,Math.max(0,Number(e.food)||0)),at:Number(e.at)||0}}
    const start=Number(raw.care?.startedAt);
    if(Number.isFinite(start)&&start>0)p.care.startedAt=Math.min(now,start);
    // Daily IDs also prevent duplicated care rewards when two offline copies are united.
    const events=Object.entries(raw.care?.events||{}).filter(([id,e])=>{
      if(!e||!Number.isFinite(e.at)||e.at<p.care.startedAt||e.at>now)return false;
      const day=dayKey(e.at);
      return ['study','practice','rest'].includes(e.kind)?id===e.kind+':'+day:e.kind==='play'&&[1,2].some(n=>id==='play:'+day+':'+n);
    }).sort((a,b)=>a[1].at-b[1].at||a[0].localeCompare(b[0])).slice(-400);
    for(const [id,e] of events)p.care.events[id]={kind:e.kind,at:e.at};
    if(outfits.find(o=>o.id===p.outfit).stars>stats(p).stars)p.outfit='none';return p;
  }
  function award(raw,attempt){const pet=normalize(raw),before=stats(pet),unlocksBefore=outfits.filter(o=>o.stars<=before.stars).map(o=>o.id);if(!attempt||!attempt.id)return{pet,reward:{food:0,stars:0,unlocks:[]}};
    const eligible=attempt.gradedCount>0&&attempt.score>=.8;
    const completeSelfReport=attempt.mode==='likert'&&attempt.likertCount>0&&attempt.likertAnswered===attempt.likertCount;
    const at=attempt.finished||Date.now();
    if(eligible||completeSelfReport){const key='food:'+attempt.id;if(!pet.ledger[key])pet.ledger[key]={kind:'reward',stars:0,food:eligible&&attempt.score===1?2:1,at}}
    if(eligible){const milestone='milestone:'+attempt.mode+':'+(attempt.ref||'all');if(!pet.ledger[milestone])pet.ledger[milestone]={kind:'reward',stars:1,food:0,at};if(attempt.score===1){const perfect='perfect:'+attempt.mode+':'+(attempt.ref||'all');if(!pet.ledger[perfect])pet.ledger[perfect]={kind:'reward',stars:1,food:0,at}}}
    const after=stats(pet);return{pet,reward:{food:after.food-before.food,stars:after.stars-before.stars,unlocks:outfits.filter(o=>o.stars<=after.stars&&!unlocksBefore.includes(o.id)).map(o=>o.id)}};
  }
  function feed(raw,id,now=Date.now()){const pet=normalize(raw,now);if(stats(pet).food<1)return{pet,ok:false};if(pet.ledger[id])return{pet,ok:false};pet.ledger[id]={kind:'feed',stars:0,food:-1,at:now};return{pet,ok:true}}
  function task(raw,kind,now=Date.now()){
    const pet=normalize(raw,now),day=dayKey(now),id=kind+':'+day;
    if(!['study','practice'].includes(kind)||pet.care.events[id])return{pet,ok:false,food:0};
    pet.care.events[id]={kind,at:now};
    const key='daily:'+id,food=pet.ledger[key]?0:1;
    pet.ledger[key]??={kind:'reward',stars:0,food:1,at:now};
    return{pet,ok:true,food};
  }
  function care(raw,now=Date.now()){
    const pet=normalize(raw,now),day=dayKey(now),events=pet.care.events;
    const study=Boolean(events['study:'+day]),practice=Boolean(events['practice:'+day]);
    const gamesUsed=[1,2].filter(n=>events['play:'+day+':'+n]).length;
    let values={nutrition:80,mood:80,energy:80},at=pet.care.startedAt;
    const decay=next=>{const days=Math.max(0,next-at)/DAY;values.nutrition=Math.max(20,values.nutrition-12*days);values.mood=Math.max(20,values.mood-10*days);values.energy=Math.max(20,values.energy-8*days);at=next};
    const timeline=[...Object.entries(events),...Object.entries(pet.ledger).filter(([,e])=>e.kind==='feed')].filter(([,e])=>e.at>=at&&e.at<=now).sort((a,b)=>a[1].at-b[1].at||({rest:1,feed:2,play:3}[a[1].kind]||0)-({rest:1,feed:2,play:3}[b[1].kind]||0)||a[0].localeCompare(b[0]));
    for(const [,event] of timeline){decay(event.at);const delta=event.kind==='feed'?{nutrition:30,mood:8,energy:5}:event.kind==='play'?{mood:25,energy:-10}:event.kind==='rest'?{energy:30}:{};for(const [key,n] of Object.entries(delta))values[key]=Math.max(20,Math.min(100,values[key]+n))}
    decay(now);for(const key of Object.keys(values))values[key]=Math.round(values[key]);
    return{...values,health:Math.round((values.nutrition+values.mood+values.energy)/3),day,study,practice,tasks:Number(study)+Number(practice),games:Math.max(0,Number(study)+Number(practice)-gamesUsed),gamesUsed,rested:Boolean(events['rest:'+day])};
  }
  function interact(raw,kind,now=Date.now()){
    const pet=normalize(raw,now),status=care(pet,now),day=dayKey(now);
    if(kind==='play'){
      if(!status.games)return{pet,ok:false,reason:'tasks'};
      if(status.energy<30)return{pet,ok:false,reason:'energy'};
      pet.care.events['play:'+day+':'+(status.gamesUsed+1)]={kind,at:now};
    }else if(kind==='rest'){
      if(status.rested)return{pet,ok:false,reason:'rested'};
      pet.care.events['rest:'+day]={kind,at:now};
    }else return{pet,ok:false,reason:'unknown'};
    return{pet,ok:true};
  }
  function merge(local,remote,now=Date.now()){
    const a=normalize(local,now),b=normalize(remote,now),events={...b.care.events};
    for(const [id,e] of Object.entries(a.care.events)){const other=events[id];if(!other||e.at<other.at)events[id]=e}
    return normalize({...b,...a,ledger:{...b.ledger,...a.ledger},care:{startedAt:Math.min(a.care.startedAt,b.care.startedAt),events}},now);
  }
  function reconcile(raw,attempts){let pet=normalize(raw);for(const a of attempts||[])pet=award(pet,a).pet;return pet}
  root.RutaRewards={initial,normalize,stats,award,feed,reconcile,outfits,dayKey,task,care,interact,merge};
})(typeof window!=='undefined'?window:globalThis);
