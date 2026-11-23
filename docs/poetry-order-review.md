# Orden estable de los poemas públicos

Rama: codex/publicaciones-antologia. Corrección local junto a la actualización editorial pendiente. Sin push, fusión, despliegue ni modificaciones remotas de datos.

## Causa y solución

La consulta anterior ordenaba por sort_order e id. Los seis originales tienen sort_order 0–5, mientras que el gestor deja que los nuevos usen el valor predeterminado 0. Por ello un nuevo poema podía quedar entre los primeros.

La consulta ahora aplica, en Supabase y ANTES de paginar:

1. first_published_at ascendente, NULL primero para contenido histórico sin fecha registrada.
2. sort_order ascendente para conservar el orden de las importaciones realizadas en la misma transacción.
3. id ascendente como desempate estable si coinciden ambos valores anteriores.

No utiliza updated_at, published_at ni la fecha de escritura. No ordena únicamente una página de resultados ni vuelve a usar un catálogo estático. La API anónima y el filtro status=published se mantienen. El mismo catálogo alimenta Poesía y los vínculos de Publicaciones.

El trigger existente private.protect_poem_metadata asigna first_published_at en la primera publicación y conserva su valor en cada UPDATE, incluida retirada y republicación. No se modifica ese trigger ni el gestor. Todos los poemas nuevos reciben una fecha del servidor al publicarse, por lo que quedan detrás de los anteriores; una retirada los oculta y una republicación recupera su posición relativa entre los poemas visibles. Los empates conservan un desempate determinista.

## Comprobación remota exclusivamente de lectura

Se consultaron los metadatos públicos del proyecto esperado gwckhuwespupovgweahj usando únicamente la publishable key local, sin mostrarla. Resultado: siete publicados. Los seis originales comparten primera publicación técnica de importación el 22/11/2026 y mantienen sort_order 0–5. No sé de dónde procede mi alma tiene sort_order 0 y primera publicación posterior, el 23/11/2026. Con la nueva consulta queda séptimo, después de Desaprendiendo.

Esta fecha técnica no se muestra como fecha histórica de escritura/publicación editorial ni modifica las fechas conocidas de los poemas. No es necesario corregir datos, añadir índices o ejecutar migraciones para este catálogo. No se han cambiado textos, títulos, slugs, vínculos, políticas RLS ni datos de Supabase.

## Vista previa

- http://127.0.0.1:8081/poesia
- http://127.0.0.1:8081/publicaciones

El servidor `npm run preview:editorial` utiliza la instantánea pública local `.editorial-public-catalog.local` (ignorada por Git), obtenida por GET, con los siete poemas publicados y sus textos intactos. Solo superpone EN MEMORIA la propuesta editorial del libro. Si falta la instantánea, utiliza los seis originales históricos para la demostración local; nunca es un fallback de producción. No actualiza automáticamente datos remotos ni permite probar autenticación. La aplicación publicada continúa leyendo Supabase.

Comprobado en navegador: los seis originales primero, en su orden; el nuevo al final; Publicaciones conserva título oficial propuesto, cuatro vínculos y dos enlaces comerciales. Sin desbordamiento en escritorio 1280 px y móvil 390 px.

## Verificación

- Vitest: 126 pruebas correctas. Regresión con dos poemas nuevos, ambos sort_order=0 y UUIDs que antes los colocaban al principio; primera publicación decide el orden, se conserva tras editar, retirar y republicar.
- La prueba verifica la ordenación exacta de la petición a PostgREST y la paginación existente; originales y nuevos comparten el mismo loader.
- TypeScript y lint de los archivos modificados correctos.
- Compilación Vercel correcta; Build Output v3, SSR y Node 24; escaneo de 97 archivos sin patrones de secretos.
- Pruebas HTTP locales: se exige la cláusula de orden real en el proveedor simulado. Se comprueba el orden completo al publicar un poema con sort_order=0, retirarlo y republicarlo; también al retirar/republicar un original. Se conservan comprobaciones de textos, rutas, SSR/SEO, errores de proveedor y privacidad de borradores. Solo datos temporales locales.

La actualización editorial de publications sigue pendiente de aprobación independiente. La corrección de orden no requiere ejecutar su SQL ni ningún otro SQL remoto.
