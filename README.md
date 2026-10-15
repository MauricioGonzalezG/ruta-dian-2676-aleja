# Ruta DIAN 2676 · Facilitador II

Ruta para OPEC 236906: 22 indicadores, siete etapas temáticas y un simulacro final. Incluye 145 casos desarrollados, 31 fichas normativas y técnicas y 30 afirmaciones de autoinforme originales. Conserva los 102 casos históricos para revisar intentos anteriores. Los resultados son pedagógicos; no predicen una nota oficial.

## Funciones

- Profundización técnica en los 22 indicadores: 84 apartados adicionales, vocabulario, mapas de artículos y fuentes oficiales.
- Biblioteca normativa con búsqueda por ley, artículo o concepto y filtro por indicador. Constitución, Estatuto Tributario, DIAN, archivos, petición, transparencia, datos personales, deberes del servidor y referencias de ofimática.
- Casos con situación, enunciado y tres opciones; explicación individual de las opciones funcionales y fundamento al terminar. Práctica normativa de 12 casos y entrenamiento extendido de 54 ítems.

- Perrito 3D de Three.js con pelaje estilizado, ojos articulados, mandíbula y patas detalladas. Su rincón incluye un bol de cerámica con croquetas individuales, cama acolchada y juguetes. Las prendas tienen costuras y pequeños detalles. Sin WebGL, muestra una ilustración de respaldo.
- Merienda animada en fases: anticipar, olfatear, comer, relamerse y quedar satisfecho. Los botones permiten acariciar, jugar, estirarse, descansar, sentarse y celebrar. Ver cómo come es una demostración que no descuenta comida ni cambia el progreso.
- Salud con alimentación, ánimo y energía. Parten en 80 y bajan 12, 10 y 8 puntos diarios, respectivamente; tienen un mínimo de 20. Comer recupera hasta 30/8/5; jugar, hasta 25 de ánimo y consume 10 de energía; descansar recupera hasta 30 de energía una vez al día. Jugar requiere 30 de energía. Ninguna ausencia quita prendas o estrellas.
- Dos tareas por día de Colombia: leer o registrar un repaso (también con tarjetas) y responder una práctica completa, sin exigir nota mínima. Cada una da una comida y un turno de juego. La comida se acumula; los turnos de juego y tareas se renuevan a medianoche. Las prácticas incompletas no cumplen esta tarea. Los premios de examen se suman a los diarios.
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

Los cuidados se guardan en el mismo progreso del usuario. El bienestar se calcula por tiempo transcurrido, incluso con la app cerrada, sin procesos en segundo plano. Los respaldos antiguos empiezan saludables al migrar y conservan sus premios. Las tareas y juegos usan identificadores diarios para que unir copias no repita la misma recompensa.

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

## Base editorial y actualización del 15 de octubre de 2026

La ampliación se almacena en `dist/technical.json`; `study-engine.js` la integra con las lecciones originales. Los identificadores `v20261015-` distinguen preguntas nuevas. Los casos originales no se reescriben: siguen disponibles para que los respaldos e intentos históricos conserven sus claves. El muestreo de prácticas nuevas excluye preguntas archivadas. Las tres metas iniciales se mantienen y cada indicador añade tres metas de profundización.

La referencia de formato es la [guía CNSC DIAN 2676 de octubre de 2026](https://www.cnsc.gov.co/sites/default/files/2026-10/dian-2676_guia_orientacion_aspirante_presentacion-pruebas-escritas_0.pdf): un caso/enunciado/tres opciones en funcionales; autoinforme de cuatro opciones en comportamiento e integridad. Se consultaron sus ejemplos públicos, incluido el nivel asistencial; los casos del sitio son originales. La cantidad, longitud y tiempos de práctica son pedagógicos. El entrenamiento extendido no se presenta como réplica de la jornada oficial ni de su calificación psicométrica.

El material utiliza el corte de normas vigentes y expedidas antes del 19 de junio de 2026 indicado por la guía. Los enlaces consolidados pueden contener modificaciones posteriores y requieren examinar notas de vigencia. Las fichas constituyen una selección orientada a los indicadores suministrados, no una promesa de cobertura de cualquier norma ni una lista oficial adicional de materias. Se evita usar la Ley 2586 de 19 de junio de 2026 como clave de este banco; las particularidades de vigencia aduanera se explican en su ficha.

Las fuentes primarias se identifican por URL y referencia en cada ficha y caso. Las reglas de razonamiento y tiempos de TRD inventados se marcan como hipotéticos; no se presentan como procedimientos reales de la DIAN. No se enseñan tarifas, umbrales ni cronogramas tributarios universales. La conservación tributaria se explica junto con Ley 962/2005 art. 46 y su modificación, sin reducirla a cinco años en todo caso. El Acuerdo AGN 001/2024 se usa con sus derogatorias y reglas transitorias.
