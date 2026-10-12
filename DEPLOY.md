# Publicar Ruta DIAN en Vercel con Turso

1. Crea una base de datos libSQL en Turso y obtén su URL y un token con permiso de lectura/escritura. SDK oficial: https://docs.turso.tech/sdk/ts/reference.
2. Copia `.env.example` a `.env.local` para desarrollo. El checkout ya tiene el archivo vacío; el ZIP de entrega incluye únicamente `.env.example`.
3. Completa `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`. Genera un `AUTH_SECRET` y úsalo como variable de servidor:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

4. Ejecuta:

```sh
npm ci
npm run build
npm test
npm run db:migrate
npm run dev
```

La migración crea `users`, `sessions`, `progress` y `auth_limits`. También se ejecuta automáticamente al primer acceso de cada instancia. Si faltan variables, informa modo navegador y termina sin conectarse a una base.

5. Sube el contenido de este directorio a tu repositorio Git, o extrae el ZIP de entrega. En Vercel importa ese repositorio y elige este directorio como raíz. Si subes el workspace completo, la raíz es `sites/dian-2676`; si subes solo este directorio, es la raíz del repositorio.
6. Usa el preset **Other** y Node.js 22 o posterior. `vercel.json` ya establece `npm run build`, salida `dist`, la función `api/index.js` y la reescritura de `/api/*`. El esquema SQL se incluye en la función; los archivos públicos se sirven desde `dist`.
7. En las variables de Vercel, añade `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` y `AUTH_SECRET`. Opcionalmente añade `APP_ORIGIN` con el origen HTTPS exacto del sitio. Déjalo vacío para que cada preview use su propio origen.
8. Vuelve a desplegar después de cambiar variables. `/api/config` devolverá `accountsEnabled: true` con todas las variables presentes; sin ellas devuelve `false`. Esto comprueba configuración, no credenciales: una base inaccesible mostrará un error al entrar o sincronizar y conservará la copia local.
9. Crea una cuenta desde **Mi cuenta**, guarda una prioridad o termina una práctica, cierra sesión y entra desde otro navegador para confirmar la persistencia.

Las variables no llevan prefijos públicos como `NEXT_PUBLIC_` o `VITE_`. No subas `.env.local`. Configuración de Vercel: https://vercel.com/docs/project-configuration/vercel-json.

Sin Turso, el mismo despliegue sirve mascota, prioridades, exámenes y respaldos en modo navegador. No aparece un formulario de cuenta que no pueda guardarse.

La publicación de ChatGPT Sites conserva su hosting estático y privacidad. Configurar las variables en Vercel activa allí el backend. Esta entrega prepara el proyecto sin crear un despliegue nuevo en tu cuenta de Vercel.
