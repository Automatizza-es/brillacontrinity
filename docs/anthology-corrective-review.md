# Correctivo editorial pendiente de revisión

Proyecto previsto: brilla-con-trinity, referencia gwckhuwespupovgweahj, Frankfurt. Rama: codex/publicaciones-antologia. No se ha ejecutado ninguna operación remota en esta preparación.

## Archivos que revisar

- Actualización correctiva: `supabase/updates/voces-entretejidas.corrective.sql`.
- Verificación posterior de solo lectura: `supabase/checks/voces-entretejidas-corrective-postcheck.sql`.

Son archivos nuevos y separados de la importación y del UPDATE anterior. No repetir ninguno de esos procedimientos antiguos.

El correctivo selecciona por el slug existente cuentos-y-poesia, bloquea esa fila y exige una sola coincidencia con SELECT INTO STRICT. Compara todos los valores de la instantánea anterior, incluido updated_at, antes de escribir. Exige los cuatro slugs vinculados previstos. Actualiza únicamente title, publisher, role, synopsis, purchase_links y updated_at por el identificador encontrado; ROW_COUNT debe ser exactamente uno. Comprueba los valores escritos, todos los demás campos intactos y las cuatro relaciones antes de COMMIT. Cualquier fallo cancela la transacción.

No inserta publicaciones, no importa poemas, no modifica portada, slug, año, kind, lugar, ISBN, identificador, created_at, poemas, usuarios, esquema o RLS. La portada conserva la ruta actual, compatible con el despliegue anterior.

La verificación compara explícitamente los cinco campos editoriales y devuelve differing_fields, además de los recuentos, portada y demás datos conocidos. Resultado esperado: publication_records=1, editorial_fields_correct=true, differing_fields=[], compatible_cover_preserved=true, other_known_fields_preserved=true, linked_poems=4 y linked_originals=4.

## Procedimiento futuro, después de revisar/aprobar

1. Abrir en VS Code el archivo correctivo indicado (Cmd+P y pegar su ruta).
2. En https://supabase.com/dashboard/project/gwckhuwespupovgweahj/sql/new comprobar nombre/referencia del proyecto y rol postgres.
3. Copiar TODO el correctivo, desde BEGIN hasta COMMIT, y ejecutarlo una sola vez.
4. Si informa de error o resultado incierto, detenerse, no repetir escrituras y comunicar el mensaje. Si el error indica una transacción abortada, ROLLBACK solo descarta esa transacción; no ejecutar COMMIT para intentar forzarla.
5. Ejecutar el archivo de verificación separado, que usa BEGIN READ ONLY y SELECT. Compartir únicamente el JSON anthology_corrective_postcheck; no contiene UUIDs, tokens ni cuerpos de poemas.
6. No publicar hasta confirmar el resultado correcto. Las páginas de Production conservarán el código actual hasta el despliegue autorizado posterior.

## Validación local realizada

PostgreSQL 17 desechable, contenedor sin red, sin puertos publicados, imagen ya disponible y solo datos sintéticos. Se cargaron el esquema y el estado editorial antiguo; después se comprobó:

- Estado inicial: editorial_fields_correct=false.
- Correctivo: exactamente un registro y editorial_fields_correct=true; differing_fields=[].
- Cuatro vínculos y todos los demás campos preservados.
- Todas las filas de poemas idénticas antes y después, incluido un borrador ajeno.
- Repetición rechazada sin cambios.
- Valores actuales inesperados rechazados sin cambios.

Contenedor eliminado al terminar. Cero conexiones remotas. No se han cambiado frontend, main, Vercel ni producción durante esta preparación.
