import { mkdir,copyFile,stat } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
await mkdir(new URL('dist/vendor/',root),{recursive:true});
for(const file of ['three.module.js','three.core.js'])await copyFile(new URL('node_modules/three/build/'+file,root),new URL('dist/vendor/'+file,root));
await copyFile(new URL('node_modules/three/LICENSE',root),new URL('dist/vendor/THREE-LICENSE.txt',root));
for(const file of ['index.html','app.js','pet-engine.js','features.js','dog-scene.js','dog-fallback.svg','wardrobe-icons.svg','functional.json','behavioral.json'])await stat(new URL('dist/'+file,root));
console.log('Static app ready in dist; Vercel API functions ready in api/.');
