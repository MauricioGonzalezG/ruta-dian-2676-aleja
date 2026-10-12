export function vercelRequest(req,env={}){
  const origin=env.APP_ORIGIN||`https://${req.headers.host}`;
  const incoming=new URL(req.url,origin);
  const route=typeof req.query?.route==='string'?req.query.route:incoming.searchParams.get('route');
  const target=route?new URL('/api/'+route.replace(/^\/+/,''),origin):incoming;
  const headers=new Headers();for(const [key,value] of Object.entries(req.headers))if(value!=null)headers.set(key,Array.isArray(value)?value.join(','):String(value));
  const body=['GET','HEAD'].includes(req.method)?undefined:typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
  return new Request(target,{method:req.method,headers,body});
}
