# Ruta DIAN 2676 · Facilitador II

Ruta para OPEC 236906: 22 indicadores, siete etapas temáticas y un simulacro final. Conserva las lecciones, 102 casos explicados y 30 afirmaciones de autoinforme originales. Los resultados son pedagógicos; no predicen una nota oficial.

## Funciones

- Perrito 3D de Three.js con giro por arrastre o teclado, animaciones, alimentación y ropa. Sin WebGL, muestra una ilustración de respaldo.
- Comida por cada examen terminado con 80% o más; dos comidas al lograr 100%. Estrellas por alcanzar una meta por primera vez y por su primer resultado perfecto. Pañuelo, gorra, suéter y corona se desbloquean con estrellas. El autoinforme completo da comida sin puntuar sus respuestas.
- Prioridades alta, normal y baja por indicador. Cambian la siguiente lección, el orden sugerido de etapas y el muestreo de práctica; la distribución abreviada del simulacro se mantiene.
- Avance, mascota y prioridades en el navegador, con respaldos JSON.
- Registro y login por correo/contraseña cuando se configura Turso, con progreso por usuario, copia local y detección de cambios concurrentes.
- Configuración para Vercel y servidor de desarrollo local.

## Ejecutar

Requiere Node.js 22 o posterior.

```sh
npm ci
npm run build
npm run dev
```

Abre la dirección Local que muestra el servidor. Sin variables de Turso, las funciones devuelven modo navegador y se puede estudiar sin cuenta. También se puede servir solamente `dist/` como sitio estático.

## Turso y Vercel

Consulta [DEPLOY.md](DEPLOY.md). Hay un `.env.local` vacío preparado en el checkout y está ignorado por Git. `.env.example` documenta las variables sin credenciales reales.

Para habilitar cuentas deben configurarse las tres variables de servidor:

| Variable | Uso |
| --- | --- |
| `TURSO_DATABASE_URL` | URL de la base libSQL de Turso. |
| `TURSO_AUTH_TOKEN` | Token con permiso de lectura y escritura. |
| `AUTH_SECRET` | Secreto aleatorio de al menos 32 caracteres. |
| `APP_ORIGIN` | Opcional: origen HTTPS exacto de la app, sin ruta. |

Las tablas se inicializan automáticamente; también puede ejecutarse `npm run db:migrate`. Los secretos no forman parte de `dist/`.

La publicación actual de **ChatGPT Sites** sirve `dist/` en modo navegador y conserva su acceso privado de ChatGPT. Las funciones de cuentas de `api/` se ejecutan al desplegar este repositorio en **Vercel**, o al usar el servidor local con Turso configurado. La cuenta de estudio y el acceso privado de ChatGPT son independientes.

## Persistencia

Se mantiene la clave histórica `ruta-dian-2676-v1`, por lo que las lecturas e intentos existentes se migran sin borrarlos. Sus buenos resultados anteriores también reciben premios.

Al registrarse se guarda el avance de invitado en la cuenta. Al entrar en una cuenta existente se recupera su avance y el de invitado queda separado; al salir vuelve el modo invitado. Las respuestas se sincronizan tras una pequeña espera para agrupar cambios. Guardar ahora permite sincronizar al terminar.

Si otro dispositivo guardó cambios, el servidor devuelve un conflicto de revisión. Mi cuenta permite unir lecturas, mejores resultados, intentos y premios sin duplicarlos. Las prioridades actuales se mantienen. La copia local se conserva si falla la red; cada cuenta usa una clave local diferente.

El login es sencillo: no incluye verificación del correo ni recuperación de contraseña por email. No hay servicios de correo ni contraseñas predeterminadas. Las contraseñas se derivan con PBKDF2; la sesión usa una cookie HttpOnly y los tokens se guardan como hashes.

## Verificación

```sh
npm test
```

Comprueba indicadores, metas, separación de conocimiento y autoinforme, prioridades, premios, alimentación, respaldos, contraseñas, sesiones, rechazo de solicitudes ajenas al sitio, aislamiento por cuenta, revisiones y adaptador de Vercel. Las pruebas SQL usan una base temporal en memoria; no modifican Turso.

Se verificaron también en navegador el perrito, prioridades tras recargar, alimentación, modo sin cuenta y registro/login sobre la API con una base temporal. La conexión a Turso real requiere las credenciales del propietario.

## Fuentes y licencias

Guía oficial DIAN 2676: https://www.cnsc.gov.co/sites/default/files/2026-10/dian-2676_guia_orientacion_aspirante_presentacion-pruebas-escritas_0.pdf. Cada lección incluye referencias oficiales; los ítems son originales y ajenos al banco reservado.

Three.js se distribuye bajo licencia MIT, incluida en `dist/vendor/THREE-LICENSE.txt`. El perrito usa geometrías propias; no necesita modelos remotos ni credenciales.
