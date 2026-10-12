# Ruta DIAN 2676

Sitio privado de preparación para Facilitador II, nivel asistencial, OPEC 236906.

Aplicación estática sin instalación: `dist/` contiene la página, los estilos, el motor de aprendizaje y dos bancos de contenido. El progreso y las respuestas se guardan en el navegador. Se pueden exportar e importar respaldos JSON.

Incluye los 22 indicadores aportados, 102 casos educativos originales con explicación y 30 afirmaciones de autoinforme sin claves. Siete etapas de estudio y una etapa final permiten avanzar sin bloqueos. Las metas de aprendizaje usan 80%, sin convertir los porcentajes de práctica en calificaciones oficiales.

El simulacro abreviado combina 18 casos funcionales, 8 afirmaciones comportamentales y 4 de integridad. La distribución es pedagógica. Se puede realizar sin límite o con 45 minutos. Solo los casos funcionales se califican; el autoinforme se conserva sin nota ni interpretación psicológica.

La guía de referencia es DIAN 2676, publicada por CNSC el 8 de octubre de 2026: https://www.cnsc.gov.co/sites/default/files/2026-10/dian-2676_guia_orientacion_aspirante_presentacion-pruebas-escritas_0.pdf. Las referencias temáticas están en cada lección. Ningún ítem pertenece al banco real del concurso.

Verificación: `node verify.cjs`. Comprueba cobertura, estructura, metas, selección por etapas, separación entre conocimiento y autoinforme, errores, respaldo y finalización por tiempo. Se verificó también en el navegador la lectura, un intento funcional completo, el autoinforme sin nota, la reanudación después de recargar y la presentación a 390 y 1280 píxeles.

Para vista previa: `python -m http.server 4173 --bind 127.0.0.1 --directory dist`.
