import { createClient } from '@libsql/client/web';
import { readFile } from 'node:fs/promises';

const schemaPath = new URL('../db/schema.sql', import.meta.url);
const clients = new Map();
export const accountsConfigured = env => Boolean(env.TURSO_DATABASE_URL?.trim() && env.TURSO_AUTH_TOKEN?.trim() && env.AUTH_SECRET?.length >= 32);
export async function migrate(db) {
  const schema = await readFile(schemaPath, 'utf8');
  const statements = schema.split(';').map(s=>s.trim()).filter(Boolean);
  await db.batch(statements, 'write');
}
export async function database(env) {
  const key = env.TURSO_DATABASE_URL+'|'+env.TURSO_AUTH_TOKEN;
  let entry=clients.get(key);
  if(!entry){
    const client=createClient({url:env.TURSO_DATABASE_URL,authToken:env.TURSO_AUTH_TOKEN});
    entry={client,ready:migrate(client)};clients.set(key,entry);
  }
  try {await entry.ready;return entry.client} catch(error){clients.delete(key);entry.client.close();throw error}
}
