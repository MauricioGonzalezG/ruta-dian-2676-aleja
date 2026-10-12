import { webcrypto } from 'node:crypto';
import { accountsConfigured, database } from './database.mjs';

const crypto=webcrypto, encoder=new TextEncoder(), SESSION_DAYS=7, MAX_BODY=1_500_000;
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
const random=(n=32)=>Buffer.from(crypto.getRandomValues(new Uint8Array(n))).toString('base64url');
export async function keyedHash(value,secret){const k=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Buffer.from(await crypto.subtle.sign('HMAC',k,encoder.encode(value))).toString('base64url')}
export async function hashPassword(password,salt=random(16)){
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const hash=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:600000},key,256);
  return `pbkdf2-sha256$600000$${salt}$${Buffer.from(hash).toString('base64url')}`;
}
export async function verifyPassword(password,stored){
  const parts=String(stored).split('$');if(parts.length!==4||parts[0]!=='pbkdf2-sha256'||parts[1]!=='600000')return false;
  const actual=await hashPassword(password,parts[2]);
  const a=encoder.encode(actual),b=encoder.encode(stored);let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a[i]||0)^(b[i]||0);return diff===0;
}
const cookie=(request,token,maxAge=SESSION_DAYS*86400)=>`ruta_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(request.url).protocol==='https:'?'; Secure':''}`;
function readCookie(request){return request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('ruta_session='))?.slice(13)||''}
function problem(message,status=400){const e=new Error(message);e.status=status;return e}
async function bodyOf(request){
  if(!request.headers.get('content-type')?.includes('application/json'))throw problem('Envía una solicitud JSON.',415);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY)throw problem('El respaldo supera el tamaño permitido.',413);
  const reader=request.body?.getReader();if(!reader)throw problem('Falta el contenido de la solicitud.');
  let size=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BODY){await reader.cancel();throw problem('El respaldo supera el tamaño permitido.',413)}chunks.push(value)}
  let bytes=new Uint8Array(size),offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
  try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw problem('No se pudo leer la solicitud.')}
}
async function sessionUser(db,request,secret){const token=readCookie(request);if(!/^[A-Za-z0-9_-]{43}$/.test(token))return null;const hash=await keyedHash(token,secret);const rows=await db.execute({sql:'SELECT users.id, users.email, users.name FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?',args:[hash,Date.now()]});return rows.rows[0]||null}
async function createSession(db,request,user,secret){const token=random();await db.execute({sql:'INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)',args:[await keyedHash(token,secret),user.id,Date.now()+SESSION_DAYS*86400000]});return cookie(request,token)}
async function rateLimit(db,request,email,secret){
  const now=Date.now(),until=now+15*60000;
  // Email limits stay effective even if a forwarded address is missing or changed.
  const ip=request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||'local';
  for(const [value,limit] of [[`email:${email}`,12],[`ip:${ip.slice(0,100)}`,80]]){
    const bucket=await keyedHash(value,secret);
    const result=await db.execute({sql:'INSERT INTO auth_limits(bucket,attempts,resets_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN auth_limits.resets_at<=? THEN 1 ELSE auth_limits.attempts+1 END,resets_at=CASE WHEN auth_limits.resets_at<=? THEN ? ELSE auth_limits.resets_at END RETURNING attempts',args:[bucket,until,now,now,until]});
    if(Number(result.rows[0].attempts)>limit)throw problem('Demasiados intentos. Vuelve a intentarlo en 15 minutos.',429);
  }
}
const lessonIds=new Set(['oficina','documental','trd','dian','ofimatica','razonamiento','servicio','orientacion1','orientacion2','adaptabilidad','etica1','etica4','comunicacion1','comunicacion2','logro1','logro2','equipo','compromiso','diligencia','honestidad','justicia','respeto']);
export function validateProgress(value){
  if(!value||value.version!==1||!value.lessons||typeof value.lessons!=='object'||!Array.isArray(value.attempts)||value.attempts.length>100)throw problem('El avance no tiene un formato válido.');
  if(Object.keys(value.lessons).some(id=>!lessonIds.has(id)))throw problem('El avance contiene indicadores desconocidos.');
  const copy=JSON.parse(JSON.stringify(value));
  // Account identity and session credentials are never accepted from a state snapshot.
  for(const key of Object.keys(copy))if(!['version','pace','lessons','stages','attempts','errors','daily','active','priorities','priorityEnabled','pet'].includes(key))delete copy[key];
  if(JSON.stringify(copy).length>1_200_000)throw problem('El avance supera el tamaño permitido.',413);
  return copy;
}
export async function handleApi(request,env=process.env,options={}){
  const path=new URL(request.url).pathname.replace(/\/$/,'');
  if(path==='/api/config'&&request.method==='GET')return json({accountsEnabled:accountsConfigured(env),storage:accountsConfigured(env)?'turso':'browser'});
  if(!accountsConfigured(env))return json({error:'Las cuentas no están activadas. Puedes continuar usando este navegador.',code:'LOCAL_MODE'},503);
  try{
    if(!['GET','POST','PUT'].includes(request.method))return json({error:'Método no permitido.'},405);
    if(request.method!=='GET'){
      const expected=env.APP_ORIGIN?.replace(/\/$/,'')||new URL(request.url).origin;
      if(request.headers.get('origin')!==expected||request.headers.get('x-ruta-client')!=='web')throw problem('La solicitud no proviene de este sitio.',403);
    }
    const db=options.db||await database(env);
    if(path==='/api/auth/register'||path==='/api/auth/login'){
      if(request.method!=='POST')return json({error:'Método no permitido.'},405);
      const body=await bodyOf(request),email=String(body.email||'').trim().toLowerCase(),password=body.password;
      if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||password.length<10||password.length>128)throw problem('Usa un correo válido y una contraseña de 10 a 128 caracteres.');
      await rateLimit(db,request,email,env.AUTH_SECRET);
      let user;
      if(path.endsWith('register')){
        const name=String(body.name||'').trim().slice(0,60);if(name.length<2)throw problem('Escribe tu nombre, con al menos dos caracteres.');
        user={id:crypto.randomUUID(),email,name};
        try{await db.execute({sql:'INSERT INTO users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?)',args:[user.id,email,name,await hashPassword(password),Date.now()]})}catch(error){if(String(error.code).includes('CONSTRAINT'))throw problem('No se pudo crear esa cuenta. Revisa los datos o intenta iniciar sesión.',409);throw error}
      }else{
        const found=(await db.execute({sql:'SELECT id,email,name,password_hash FROM users WHERE email=?',args:[email]})).rows[0];
        // Equal password work for unknown accounts limits account enumeration by timing.
        const stored=found?.password_hash||'pbkdf2-sha256$600000$missing-user-fixed-salt$unavailable';
        if(!await verifyPassword(password,stored)||!found)throw problem('El correo o la contraseña no coinciden.',401);
        user={id:found.id,email:found.email,name:found.name};
      }
      return json({user},path.endsWith('register')?201:200,{'Set-Cookie':await createSession(db,request,user,env.AUTH_SECRET)});
    }
    const user=await sessionUser(db,request,env.AUTH_SECRET);
    if(path==='/api/auth/me'&&request.method==='GET')return json({user});
    if(!user)throw problem('Inicia sesión para guardar tu avance en la cuenta.',401);
    if(path==='/api/auth/logout'&&request.method==='POST'){
      await db.execute({sql:'DELETE FROM sessions WHERE token_hash=?',args:[await keyedHash(readCookie(request),env.AUTH_SECRET)]});return json({ok:true},200, {'Set-Cookie':cookie(request,'',0)});
    }
    if(path==='/api/progress'&&request.method==='GET'){
      const saved=(await db.execute({sql:'SELECT state_json,revision,updated_at FROM progress WHERE user_id=?',args:[user.id]})).rows[0];
      return json(saved?{state:JSON.parse(saved.state_json),revision:Number(saved.revision),updatedAt:Number(saved.updated_at)}:{state:null,revision:0});
    }
    if(path==='/api/progress'&&request.method==='PUT'){
      const body=await bodyOf(request),state=validateProgress(body.state),revision=body.revision;
      if(!Number.isInteger(revision)||revision<0)throw problem('Falta la versión del avance.');
      const encoded=JSON.stringify(state),now=Date.now();let changed;
      if(revision===0)changed=await db.execute({sql:'INSERT INTO progress(user_id,state_json,revision,updated_at) VALUES(?,?,1,?) ON CONFLICT(user_id) DO NOTHING RETURNING revision',args:[user.id,encoded,now]});
      else changed=await db.execute({sql:'UPDATE progress SET state_json=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=? RETURNING revision',args:[encoded,now,user.id,revision]});
      if(!changed.rows.length){const saved=(await db.execute({sql:'SELECT state_json,revision FROM progress WHERE user_id=?',args:[user.id]})).rows[0];return json({error:'Hay cambios guardados desde otro dispositivo.',code:'REVISION_CONFLICT',state:saved?JSON.parse(saved.state_json):null,revision:Number(saved?.revision||0)},409)}
      return json({revision:Number(changed.rows[0].revision),updatedAt:now});
    }
    return json({error:'Ruta no encontrada.'},404);
  }catch(error){return json({error:error.status?error.message:'No se pudo conectar al servicio. El avance local se conserva.'},error.status||503)}
}
