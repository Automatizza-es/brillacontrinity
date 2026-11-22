# Preparación de la importación de los seis poemas originales

Estado: validación local completada e inventario remoto de lectura aportado por la propietaria revisado; autorización expresa recibida para que la propietaria ejecute el SQL desde SQL Editor; pendiente de ejecución y verificación. **No se ha ejecutado la importación remota.**

Rama: `prep/phase-1-supabase`. Destino previsto exclusivamente: `brilla-con-trinity`, referencia `gwckhuwespupovgweahj`, Frankfurt. La corrección visual de admin.css ya estaba aprobada y modificada al comenzar esta etapa; se conserva sin cambios.

## Origen, correspondencia y orden

La única fuente de textos y metadatos es src/content/poems.ts y src/content/publications.ts. Se importan los valores de los módulos TypeScript sin analizarlos con expresiones regulares ni reconstruir textos. El generador valida el conjunto y orden exacto de los seis slugs, la única fecha conocida y los cuatro enlaces recíprocos con la antología. Cualquier ampliación o cambio de fecha exige revisar el mapeo.

| Orden | Título exacto      | URL conservada             | Antología        | Fecha de escritura                                  |
| ----- | ------------------ | -------------------------- | ---------------- | --------------------------------------------------- |
| 0     | Atrévete a brillar | /poesia/atrevete-a-brillar | —                | 2023-05-07; se conserva también «7 de mayo de 2023» |
| 1     | Quise ser…         | /poesia/quise-ser          | —                | Sin dato: NULL                                      |
| 2     | Círculo de mujeres | /poesia/circulo-de-mujeres | Cuentos y poesía | Sin dato: NULL                                      |
| 3     | Yo soy agua        | /poesia/yo-soy-agua        | Cuentos y poesía | Sin dato: NULL                                      |
| 4     | Me pierdo…         | /poesia/me-pierdo          | Cuentos y poesía | Sin dato: NULL                                      |
| 5     | Desaprendiendo     | /poesia/desaprendiendo     | Cuentos y poesía | Sin dato: NULL                                      |

La publicación conserva exactamente título, Editorial Rubin, San Luis (Argentina), año 2026, tipo, participación de Trinity y ruta local de portada del origen. No se añade ISBN, sinopsis ni enlaces de compra. Las descripciones ausentes quedan NULL.

Se propone estado published para los seis originales, ya presentes en la web pública. Esto permite su lectura por Data API según las políticas existentes, pero **no cambia ni conecta las páginas públicas**. El estado final forma parte del plan que se autorizará antes de escribir.

published_at queda NULL: se desconoce la fecha histórica de publicación web. El trigger existente registra automáticamente first_published_at con la fecha de primera publicación en esta base de datos; ese dato técnico no se presenta como fecha histórica del poema. created_at/updated_at son también eventos reales de inserción, no fechas inventadas de escritura.

El orden 0–5 se almacena en sort_order. El listado público sigue usando el orden del módulo estático; el listado administrativo conserva su orden habitual por modificación. El borrador de prueba no se reordena ni se modifica.

## Archivos preparados

- scripts/prepare-original-poems-import.mjs: genera y comprueba artefactos offline. No hace peticiones de red ni puede ejecutar SQL remoto.
- supabase/imports/original-six-poems.sql: importación transaccional preparada, pendiente de autorización. Se coloca fuera de migrations para impedir su aplicación mediante un db push rutinario.
- supabase/imports/original-six-poems.manifest.json: títulos, URLs, orden, fechas, relaciones, bytes UTF-8, número de líneas y SHA-256 de cada texto.
- supabase/checks/original-poems-preflight.sql: inventario y comparación exacta mediante BEGIN READ ONLY y SELECT. Sirve también como comprobación posterior.
- scripts/original-poems-import.test.mjs: pruebas de correspondencia exacta y protección del proceso.
- scripts/test-original-poems-import-local.mjs: ejecución exclusivamente en PostgreSQL desechable local.

Huella SHA-256 del payload preparado: `1c7bb3671c17b689f707493a7ddbf08a3b87386d28a67c56a781a2f2ffe0d3a1`.

## Repetibilidad y protección editorial

Una sola transacción, con límite de espera de bloqueo de cinco segundos y límite de ejecución de treinta segundos. Se bloquean escrituras concurrentes de poems/publications durante esa futura operación corta; si no se consigue el bloqueo, se detiene sin forzar sesiones ni sobrescribir una edición concurrente.

Antes de insertar se comparan todos los registros existentes de esos slugs y la publicación. Se comparan texto, título, descripción, fechas, estado, orden y vínculo editorial. La comparación usa valores exactos, sin trim ni normalización Unicode. No se comparan UUID ni marcas técnicas que deben poder variar entre inserciones.

- Registro ausente: se insertará.
- Registro completamente coincidente: se omitirá, sin actualizarlo ni modificar su updated_at.
- Registro diferente: se abortará toda la transacción para revisión manual. Puede tratarse de una edición de Trinity; nunca se sustituye por la versión estática.

Solo hay INSERT con ON CONFLICT DO NOTHING. No hay UPDATE, DELETE, TRUNCATE, nuevas tablas, cambios de permisos ni funciones persistentes. La comprobación de diferencias y los bloqueos evitan que ON CONFLICT oculte una inserción concurrente de contenido distinto.

Se compara una instantánea interna exacta de todas las columnas de todos los poemas ajenos a los seis slugs antes y después, y se exige que no cambie. Esto incluye el borrador de prueba completo y sus marcas técnicas, sin necesitar conocer ni mostrar su UUID o texto. Si el borrador usa uno de los seis slugs y difiere en cualquier campo, la importación se aborta: no se renombra, publica ni elimina automáticamente.

La publicación se resuelve por su slug único y se obtiene su UUID real para relacionar los cuatro poemas; los dos primeros quedan sin publicación. Se verifica de nuevo la correspondencia completa antes del COMMIT. No se edita el historial de migraciones de esquema: este es un mantenimiento de contenido versionado en Git.

## Comprobación remota sin tokens nuevos

La publishable key anónima no puede inventariar borradores: RLS los oculta. Un resultado vacío con ella no probaría ausencia de conflictos. Los PAT temporales fueron revocados y no se reutiliza otra sesión global.

Procedimiento propuesto a la propietaria:

1. Abrir https://supabase.com/dashboard/project/gwckhuwespupovgweahj/sql/new y comprobar visualmente nombre y referencia del proyecto. La referencia constante que devuelve el SQL solo expresa el destino esperado; **no demuestra por sí sola la identidad del servidor**.
2. Copiar exclusivamente supabase/checks/original-poems-preflight.sql y ejecutarlo con rol postgres. No copiar ni ejecutar el archivo de importación.
3. Revisar la columna import_preflight. reader_sees_all_rows debe ser true; de lo contrario, la ausencia de filas no es concluyente.
4. Comparar source_sha256 con la huella anterior. Los seis resultados deben ser absent o matching; publication debe ser absent o matching. Cualquier conflict obliga a detenerse y revisar los nombres de differing_fields, sin exponer el contenido privado.
5. Confirmar los recuentos de poemas y borradores ajenos. El resultado solo muestra slugs públicos previstos, recuentos y booleanos; no devuelve emails, UUID ni texto de borradores.

La propietaria aportó el JSON de la consulta de solo lectura. Se revisó contra los artefactos locales sin hacer una nueva conexión remota:

- source_sha256 coincide exactamente con la huella preparada.
- reader = postgres y reader_sees_all_rows = true: el resultado no está limitado por RLS.
- Los seis slugs previstos figuran como absent; no hay conflictos en ese inventario.
- publication = absent: se creará una única antología.
- unrelated_poems = 1 y unrelated_drafts = 1: existe un único poema ajeno y es borrador; queda fuera de las inserciones y se comprobará su conservación exacta dentro de la transacción.

La referencia incluida en el resultado sigue siendo una constante esperada, no una comprobación independiente del servidor. La identidad del destino depende de haber ejecutado la consulta en el enlace exacto del proyecto indicado a la propietaria. No se ha usado otra sesión ni se ha creado ningún token.

La preparación está lista para revisión y autorización: se prevén seis inserciones de poemas y una de publicación, sin actualizaciones ni eliminaciones. No se ha ejecutado ninguna escritura remota. El inventario debe repetirse inmediatamente antes de la futura ejecución; cualquier nuevo conflicto detendrá la operación.

No se ejecuta una prueba con INSERT/ROLLBACK en Supabase: aunque se revirtiera, sería una escritura remota no autorizada. Las pruebas de importación se limitan a Docker local.

## Validaciones locales realizadas

- 51 pruebas Node (incluidas siete específicas de importación) y 88 pruebas Vitest satisfactorias; lint de los scripts y git diff --check correctos.
- Igualdad byte a byte de los seis textos entre origen, payload, JSON incrustado en SQL y PostgreSQL local; conservación de títulos, puntuación, estrofas, fechas y orden.
- Correspondencia exacta de cuatro relaciones con una única antología; ausencias mantenidas como NULL o arrays vacíos según el esquema.
- Primera importación, repetición íntegra sin duplicados ni cambios de marcas técnicas, y repetición parcial que inserta solo los originales que faltan.
- Un borrador ficticio ajeno conserva todas sus columnas y marcas técnicas.
- Ediciones de un poema, conflictos editoriales de la publicación y un borrador con un slug original causan aborto total, sin inserciones parciales ni sobrescrituras.

Comandos locales:

```sh
npm run prepare:poems-import
npm run check:poems-import
npm run test:poems-import
npm run test:poems-import:local
```

Ninguno de estos comandos conecta Supabase. El último usa exclusivamente un contenedor PostgreSQL local que se elimina al finalizar.

## Punto de parada y futura ejecución

El inventario de lectura ya fue revisado; detenerse hasta recibir autorización expresa. Una vez autorizado explícitamente, volver a verificar destino y huella, repetir el inventario y aplicar una sola vez el SQL preparado mediante el SQL Editor de ese proyecto, con la propietaria o bajo un procedimiento administrativo expresamente aprobado. No se necesitan secret keys, contraseñas de PostgreSQL ni nuevos PAT para este procedimiento manual.

Tras una ejecución autorizada, repetir el SELECT de comparación: los seis deben ser matching con body_equal true, publication matching, orden y vínculos exactos, y el recuento de borradores ajenos conservado. La comprobación interna de la transacción certifica además que esos registros no se modificaron. Si hay un error ambiguo, comprobar por lectura antes de cualquier repetición.

No se conectarán las páginas públicas, se migrarán otros contenidos, se desplegará ni se modificará Vercel o main dentro de esta preparación.

## Ejecución personal autorizada

La propietaria ha autorizado seis inserciones originales y una publicación, conservando el borrador previo, y ha indicado expresamente que el agente no realice operaciones remotas. El SQL preparado se ha comprobado de nuevo con `--check` y sigue coincidiendo exactamente con las fuentes y la huella revisada.

1. Abrir el SQL Editor del proyecto exacto `gwckhuwespupovgweahj` y confirmar visualmente brilla-con-trinity. Usar el rol postgres.
2. Repetir `supabase/checks/original-poems-preflight.sql`. Antes de la primera ejecución se esperan seis absent, publication absent, un poema ajeno que es borrador, reader_sees_all_rows true y la huella revisada. Si cambia algo, detenerse y revisar.
3. En una consulta nueva, copiar **todo** `supabase/imports/original-six-poems.sql`, desde BEGIN hasta COMMIT, sin seleccionar un fragmento. Ejecutar una sola vez. La transacción valida e inserta, comprueba el contenido y la preservación exacta de las filas ajenas antes de confirmar. Ante un error, no reintentar a ciegas.
4. Repetir preflight: seis matching con body_equal true y differing_fields vacíos, publication matching y un borrador ajeno.
5. Ejecutar `supabase/checks/original-poems-postimport.sql`, exclusivamente de lectura: total_poems 7, original_poems 6, published_originals 6, publication_records 1, linked_originals 4, order_correct true, unrelated_poems 1 y unrelated_drafts 1.
6. Abrir /admin en una pestaña nueva, iniciar sesión personalmente si hace falta, escoger Todos los estados y comprobar siete registros: seis originales publicados y el borrador previo. Abrir los originales para revisar texto/vista previa sin guardar cambios. El orden original se valida mediante sort_order; /admin presenta el listado por última modificación.

La ejecución y las verificaciones reales siguen pendientes. Solicitar únicamente los JSON de comprobación y la confirmación visual del panel; no contraseñas, cookies, tokens ni el contenido del borrador. No hay nuevos PAT ni cambios en la sesión global.

## Confirmación de cierre recibida

La propietaria confirmó la ejecución y la igualdad exacta posterior de los seis originales con las fuentes, la antología y sus cuatro relaciones, la conservación del borrador y la presencia de los siete poemas en /admin. El JSON postcheck aportado registró seis originales publicados, sort_order 0–5 correcto, una publicación editorial, cuatro vínculos y un único borrador ajeno, con visibilidad completa del lector. Esta confirmación cierra la importación; no volver a ejecutarla como parte de la conexión pública.
