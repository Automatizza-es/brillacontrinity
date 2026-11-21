# Plan de ejecución pendiente de autorización

## Destino y SQL fijados

- Rama: `prep/phase-1-supabase`.
- Proyecto: `brilla-con-trinity`.
- Referencia exacta: `gwckhuwespupovgweahj` (identificador público, no una credencial).
- Región: Frankfurt, `eu-central-1`.
- Archivo: `supabase/migrations/20261111000100_poetry_foundation.sql`.
- SHA-256: `3c26003a7e168e2e995f708337fd5bee9d3a95ced3f16cece9a62804de3a418d`.

El inventario remoto de lectura del 21 de noviembre confirmó ese destino y que no existen las tres tablas, private ni migraciones previas. El origen actual de `.env.local` sigue coincidiendo. No se ha hecho una nueva consulta remota en esta preparación: se repetirá el inventario inmediatamente antes de una futura escritura.

La propietaria ha confirmado que private no está expuesto en Data API y que Automatically expose new tables está desactivado y guardado. Esa confirmación sustituye el pendiente visual anterior; no se solicitarán permisos adicionales para leer secretos de Data API.

## Método compatible con el token solicitado

Usar directamente la Management API oficial:

```text
POST https://api.supabase.com/v1/projects/gwckhuwespupovgweahj/database/migrations
Authorization: Bearer <token introducido mediante entrada oculta>
Content-Type: application/json

{"name":"poetry_foundation","query":"<SQL revisado, leído del archivo local>"}
```

Este endpoint exige el permiso fine-grained `database_migrations_write`, mostrado como Migrations Read-write. No exige Database Read-write para aplicar una migración. El permiso OAuth genérico `database:write` de la documentación no debe confundirse con los permisos de un PAT restringido.

Permisos del nuevo PAT, exclusivamente para este proyecto:

- Project Settings Read: identidad.
- Database Read: catálogo de solo lectura.
- Migrations Read & Write: historial y aplicación.

No usar contraseña PostgreSQL, service_role, CLI global, login, link, creación de roles temporales ni endpoint de SQL genérico. Una denegación de permisos detendrá el proceso: no habrá ampliación ni otra sesión automática.

## Limitación de versión que requiere aprobación

El endpoint admite `query`, `name` y `rollback`, pero **no un campo version**. Genera la marca temporal del historial en servidor. Poner la fecha local en `name` no garantiza que se registre la versión `20261111000100`. El endpoint PUT solo registra historial sin aplicar SQL, y PATCH modifica nombre/rollback, no ofrece cambiar la versión: no son sustitutos de una aplicación versionada coherente.

La propuesta compatible con estos permisos es:

1. Aplicar una sola vez el SQL revisado con el nombre `poetry_foundation`, únicamente tras autorización.
2. Consultar el historial oficial antes y después, identificar exactamente una entrada nueva con ese nombre y obtener su versión real.
3. Verificar el esquema y la entrada registrada. No asumir éxito solo por una respuesta HTTP.
4. Renombrar localmente el archivo a `<version_remota>_poetry_foundation.sql`, manteniendo exactamente los mismos bytes y hash. Actualizar referencias de los scripts en el mismo commit local y repetir sus comprobaciones.
5. Conservar la trazabilidad del nombre original y hash en el registro de ejecución y en Git. No dejar ambos archivos como migraciones pendientes. No reescribir commits, hacer migration repair ni inventar una entrada antigua.

**Este cambio de nombre local forma parte de la autorización pendiente. No se ha renombrado ningún archivo.** Si es obligatorio conservar exactamente `20261111000100` también en remoto, este endpoint no cumple ese requisito y no debe ejecutarse. Habría que revisar otro procedimiento con el usuario, sin recurrir a contraseñas ni permisos no autorizados.

El SQL contiene BEGIN/COMMIT propios. No se afirma que ese COMMIT y el registro añadido por la API sean una sola transacción atómica: debe comprobarse tanto esquema como historial. Si hay timeout, desconexión o un error ambiguo, no repetir el POST. Consultar el estado por lectura y detenerse para reconciliar el resultado. No añadir un rollback destructivo automático.

## Entrada oculta y aislamiento

Se reutilizará `promptHiddenToken` de `scripts/supabase-isolated-preflight.mjs`, ya probado. Solo acepta una Terminal interactiva, no imprime caracteres ni asteriscos y restaura el modo de terminal. El nuevo token se pedirá después de la autorización, no se necesita introducirlo ahora.

El proceso eliminará cualquier token heredado de su propio entorno, pedirá el nuevo y lo asignará a `process.env.SUPABASE_ACCESS_TOKEN` únicamente en ese proceso. No se modificará el entorno padre, el llavero ni archivos globales. Se eliminará la variable al terminar. No se guardará en `.env.local`, comandos, reportes, logs o Git. No habrá sustitución por la publishable key o una sesión global si falla.

## Objetos y operaciones revisados

- Esquema private; tablas vacías admin_users, poems y publications.
- Claves primarias/unicidad, claves foráneas y restricciones; dos índices explícitos y cinco automáticos.
- Dos funciones en private y un trigger para proteger metadatos y slug.
- RLS en las tres tablas, siete políticas, permisos mínimos y tres comentarios.
- Historial de migraciones gestionado por el endpoint, comprobado después.

No hay DROP, TRUNCATE, DELETE de datos ni INSERT de usuarios/poemas/publicaciones. La cláusula ON DELETE CASCADE establece un comportamiento futuro; no borra filas al aplicar el archivo. No se ha cambiado el SQL revisado.

## Comprobaciones posteriores preparadas

`supabase/checks/poetry-postmigration.sql` contiene solo SELECT para verificar:

1. Las tres tablas y RLS activado.
2. Las siete políticas y sus expresiones USING/WITH CHECK.
3. Privilegios efectivos SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER de anon y authenticated.
4. SECURITY DEFINER, search_path, propietario y permisos EXECUTE de las dos funciones.
5. Existencia y habilitación del trigger y las restricciones.
6. Ausencia de datos iniciales, solo si el rol lector puede ver todas las filas pese a RLS. Si no tiene BYPASSRLS o acceso equivalente, contar cero no prueba que no haya datos; no presentarlo como comprobación concluyente.

Resultado de permisos esperado:

| Recurso      | anon                                 | authenticated                                         |
| ------------ | ------------------------------------ | ----------------------------------------------------- |
| poems        | SELECT limitado por RLS a publicados | SELECT y CRUD sujetos a las políticas administrativas |
| publications | SELECT                               | SELECT                                                |
| admin_users  | Sin acceso                           | Solo SELECT de su propia pertenencia                  |

Ningún cliente puede escribir en admin_users, ni siquiera una administradora existente. No habrá una administradora todavía. Los GRANT no bastan por sí solos: revisar también las políticas y el helper de autorización.

La versión real y el nombre se comprobarán mediante GET de migraciones. La exclusión de private y la exposición automática desactivada se conservarán, sin cambiar configuración remota. No se crearán usuarios ni fixtures remotas para estas verificaciones; las pruebas de permisos con fixtures siguen siendo locales. Los logins reales y las pruebas con borradores reales necesitarán una etapa posterior autorizada.

## Preparación local y punto de parada

- `npm run plan:poetry-migration`: verifica offline referencia y hash y muestra el plan. No pide token, no llama a ninguna API y no incluye modo apply.
- `npm run test:migration-plan`: cuatro pruebas de destino, huella y parámetros seguros.
- El procedimiento de entrada oculta sigue cubierto por las 14 pruebas del preflight.
- El SQL de postverificación se valida solo en PostgreSQL local desechable antes de entregar el plan.

No se ha implementado un comando ejecutable de escritura en esta etapa. Tras la aprobación concreta se preparará su ejecución controlada, con revalidación y sin cambiar silenciosamente la estrategia de versión. No se han modificado Supabase remoto, Vercel, la web pública ni la sesión de Claude Code.

## Referencias oficiales

- Aplicación y permiso: https://supabase.com/docs/reference/api/v1-apply-a-migration
- Permisos de PAT: https://supabase.com/docs/guides/platform/personal-access-tokens
- Historial: https://supabase.com/docs/reference/api/v1-list-migration-history
- Upsert sin aplicar: https://supabase.com/docs/reference/api/v1-upsert-a-migration
- Campos editables del historial: https://supabase.com/docs/reference/api/v1-patch-a-migration
- Limitación de versiones reconocida en el repositorio oficial: https://github.com/supabase/mcp/issues/241
