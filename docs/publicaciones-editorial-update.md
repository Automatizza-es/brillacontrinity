# Publicaciones: Voces entretejidas

Preparación local en `codex/publicaciones-antologia`, desde main/82d761d. No se ha desplegado ni modificado Supabase remoto. Los originales históricos de src/content y las importaciones de poemas permanecen intactos.

## Presentación

Se conserva la URL /publicaciones, la cabecera, el diseño editorial, las fuentes y los tokens de color existentes. El libro gana protagonismo con portada de hasta 420 px y título oficial. La descripción y la participación de Trinity preceden a los cuatro poemas y a «Dónde conseguir el libro». Los enlaces físico/ebook son los facilitados por la propietaria y se abren en su destino, sin precios ni información de ejemplares para autores. No se añaden rastreadores ni widgets externos. El SEO usa el título y la editorial procedentes del loader de Supabase, manteniendo SSR y el tratamiento de errores existente.

## Material

Se han revisado los siete archivos de Carrusel Libro y el ZIP de vídeos. 005.jpg y 006.jpg tienen 2161 × 2701 píxeles, frente a los PNG de 1122 × 1402. Se selecciona 006.jpg: muestra el libro disponible, sin una fecha antigua de disponibilidad. Se recorta únicamente el anuncio alrededor del libro, conservando la portada y el lomo completos; caja de recorte (470, 510, 1670, 2350). No se reconstruye ni inventa una portada plana.

Derivados públicos: voces-entretejidas-480.webp (480 × 736, 40 132 bytes) y voces-entretejidas-960.webp (960 × 1472, 113 188 bytes), WebP calidad 86, sin ampliación del original. srcset permite elegir resolución y width/height reserva espacio. Los originales se conservan en material-editorial, excluido de Git. No se incorporan ZIP, ebooks, documentos de impresión ni material de otros autores. La imagen antigua se conserva porque la publicación remota todavía la utiliza y puede ser necesaria para reversión.

El ZIP Video contiene Fecha-Disponible.mp4 y Ya-Disponible.mp4: ambos 10,04 s, aproximadamente 12 MB; el segundo es H.264/AAC, 1080 × 1920. Se revisa visualmente la secuencia Ya-Disponible: animación de portada y anuncio de disponibilidad, sin aportar información nueva sobre Trinity. Se recomienda omitirlo en esta primera versión por redundancia y tamaño. Si se aprueba más adelante, ubicarlo bajo la presentación como contenido opcional, con poster, controls, playsInline y preload=none, sin autoplay y con compresión previa; revisar audio/accesibilidad antes de incorporarlo. No hay vídeo en el bundle ni en la página actual.

La fecha solicitada (12/11/2026) coincide con la ficha del ebook en Casa del Libro. Algunas piezas promocionales anuncian disponibilidad el 23/11, por lo que no se usan esas fechas gráficas en la ficha.

## Datos: propuesta pendiente de autorización

Se ha realizado únicamente un GET anónimo del registro editorial por slug usando la publishable key local, sin imprimirla. Existe un solo registro cuentos-y-poesia y todavía conserva el título anterior. El resto de esta preparación utiliza datos locales. Ninguna escritura remota.

`supabase/updates/voces-entretejidas.json` contiene la propuesta pública. No se carga como sustituto de Supabase en producción. Los campos existentes title, publisher, year, kind, role, synopsis, cover_url y purchase_links son suficientes. La fecha de publicación se expresa en un párrafo de synopsis, sin introducir un campo de fecha ni una migración. purchase_links ya es un array JSONB de objetos label/url compatible con ambos formatos de compra.

`supabase/updates/voces-entretejidas.prepared.sql` es una actualización de datos preparada, NO ejecutada. En una transacción:

1. Localiza y bloquea exactamente el registro por slug, sin insertar nada.
2. Compara la fila con la instantánea de lectura (incluido updated_at), omitiendo id/created_at; si cambió, cancela en vez de sobrescribir.
3. Exige que los cuatro vínculos coincidan con los poemas de Trinity previstos.
4. Actualiza solo los campos editoriales enumerados y devuelve sus datos públicos. Conserva id, slug, place e isbn. No modifica poemas, usuarios, RLS ni esquema. El UPDATE mantiene updated_at explícitamente.

El SQL debe revisarse y aprobarse antes de ejecutarlo. Si se repite tras aplicarlo, la comparación previa fallará y obligará a revisar; nunca creará un duplicado. No se ha validado ejecutándolo sobre la base remota.

Tras aprobación futura: ejecutar personalmente el UPDATE autorizado en SQL Editor de brilla-con-trinity, tras revisar destino gwckhuwespupovgweahj y snapshot. El SQL conserva cover_url para no romper la imagen antes del despliegue; el frontend nuevo reconoce esa ruta histórica de la antología y muestra los derivados oficiales optimizados. No requiere un segundo UPDATE de portada. Solo después de la confirmación de la propietaria se integrará main y desplegará el frontend. Después comprobar registro único, cuatro relaciones, seis poemas originales y borradores intactos, y web pública/SEO. Si hace falta revertir contenido, preparar un UPDATE inverso revisado desde la instantánea conservada en el SQL; no volver a importar poemas ni ejecutar migraciones. Un rollback de Vercel por sí solo no revierte los datos de Supabase.

## Vista previa y pruebas

`npm run preview:editorial` abre http://127.0.0.1:8081/publicaciones con una API simulada en memoria en 127.0.0.1:4177 y una clave sintética. Nunca utiliza Supabase remoto; no usar esta API para probar /admin. El frontend sigue usando sus loaders reales y recibe el catálogo simulado, con el registro propuesto y los originales históricos. La versión publicada sigue leyendo Supabase, sin fallback ni flags de demostración.

125 pruebas Vitest correctas; TypeScript y ESLint de los archivos modificados correctos. Build Vercel y check:preview-build correctos (SSR, Node 24, sin patrones secretos). check:poems-import confirma sin red los seis originales y sus cuatro vínculos históricos. Inspección de escritorio a 1280 px y móvil a 390 px: portada cargada, sin desbordamiento, cuatro enlaces de poemas y dos enlaces comerciales correctos. Pruebas nuevas: destinos de los enlaces, participación/fecha, ausencia de «Próximamente», omisión de poemas ausentes del catálogo publicado y sección de compra ausente cuando faltan enlaces.

Fuentes consultadas para contrastar destinos y fecha:

- https://www.popularlibros.com/libro/antologia-de-cuento-y-poesia-voces-entretejidas_I0100239125
- https://www.casadellibro.com/ebook-antologia-de-cuento-y-poesia-voces-entretejidas-ebook/9798237343687/19116289

Las pruebas HTTP aisladas también han pasado: SSR con los seis textos exactos, fechas/SEO, vínculos, 404 de borradores y slugs desconocidos, ciclo de publicación/retirada/republicación sin reconstrucción, y errores de proveedor sin contenido obsoleto ni falsas bibliotecas vacías. Solo se usaron datos temporales locales.

## Secuencia autorizada de noviembre: Supabase antes del despliegue

La propietaria ha autorizado preparar la publicación conjunta, pero exige confirmar personalmente la actualización remota antes del push/fusión/despliegue. El SQL preparado se ha ajustado para conservar `cover_url` mientras la versión anterior sigue en Production. El frontend reconoce esa ruta histórica para esta antología y sirve los nuevos derivados locales una vez desplegado; el campo no apunta anticipadamente a un archivo inexistente. La ruta de imagen del JSON de propuesta representa el derivado de frontend, no un valor que este SQL vaya a guardar. `updated_at` se actualiza explícitamente: el trigger de poemas no se aplica a publicaciones.

Ejecutar personalmente una sola vez el archivo `supabase/updates/voces-entretejidas.prepared.sql` en SQL Editor del proyecto brilla-con-trinity, referencia gwckhuwespupovgweahj, rol postgres. Después ejecutar `supabase/checks/voces-entretejidas-postupdate.sql`, que usa BEGIN READ ONLY y solo SELECT. Compartir únicamente el JSON `anthology_update_postcheck`: se esperan un registro, campos editoriales correctos, portada compatible conservada, cuatro vínculos/correspondencias originales, seis originales y posición 7 para el nuevo poema en la consulta corregida. Production mantendrá todavía la ordenación antigua hasta desplegar.

Si cualquier comando falla, detenerse sin repetir UPDATE ni eliminar la condición de comparación. Si el UPDATE pudo confirmarse pero no se conoce el resultado, reconciliar exclusivamente mediante la consulta de lectura. No publicar hasta la confirmación de la propietaria. Las comprobaciones locales de esta adaptación pasan: 127 pruebas, TypeScript, lint, build Vercel y escaneo de salida sin patrones secretos. No se ha ejecutado ninguno de estos SQL sobre el servicio remoto.
