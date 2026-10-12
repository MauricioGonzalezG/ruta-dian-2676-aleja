import { accountsConfigured, database } from '../server/database.mjs';
if(!accountsConfigured(process.env)){console.log('Modo navegador: configura TURSO_DATABASE_URL, TURSO_AUTH_TOKEN y AUTH_SECRET para activar cuentas.');process.exit(0)}
try{const db=await database(process.env);console.log('Tablas de usuarios, sesiones y progreso listas.');db.close()}catch{console.error('No se pudo inicializar Turso. Revisa las variables y los permisos del token.');process.exitCode=1}
