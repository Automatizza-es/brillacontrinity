# Revisión previa a la migración de poesía

Revisión remota: 21 de noviembre de 2026. Rama: `prep/phase-1-supabase`.

**Resultado: no se detectan conflictos de estructura o datos para la migración. No está aplicada ni autorizada su ejecución. Falta verificar la configuración de esquemas expuestos por Data API y preparar por separado el acceso de escritura autorizado.**

## Identidad y aislamiento

La propietaria ejecutó `npm run preflight:supabase` e introdujo un token exclusivo de lectura mediante entrada oculta. El proceso lo utilizó únicamente como SUPABASE_ACCESS_TOKEN en su propia memoria; no utilizó CLI, keychain, login ni otras sesiones.

La consulta directa a la Management API verificó:

- Nombre exacto: `brilla-con-trinity`.
- Región: `eu-central-1`, Frankfurt.
- Referencia: coincide exactamente con la obtenida del origen de Project URL en `.env.local`. Se ha repetido esa comparación al revisar el informe.
- Informe generado el 21 de noviembre de 2026 a las 16:33 UTC.

El informe completo está en `.supabase-preflight-report.local`, ignorado por Git y con permisos 0600. No contiene el token. No se ha copiado ese informe al repositorio. La comprobación de identidad por este endpoint no certifica el plan comercial; Free es el plan indicado por la propietaria.

La antigua sesión global de CLI no se ha modificado. Quedan sustituidas las instrucciones anteriores de este documento que proponían `supabase login`: no utilizarlas para Trinity mientras pueda compartir estado con Claude Code.

## Inventario remoto observado

| Comprobación                                                                | Resultado                    |
| --------------------------------------------------------------------------- | ---------------------------- |
| PostgreSQL compatible                                                       | Sí                           |
| Contrato `auth.users` y `auth.uid()`                                        | Existe                       |
| `gen_random_uuid()`                                                         | Existe                       |
| Roles `anon` y `authenticated`                                              | Existen                      |
| `public.admin_users`                                                        | No existe                    |
| `public.poems`                                                              | No existe                    |
| `public.publications`                                                       | No existe                    |
| Relaciones en public/private (tablas, vistas, secuencias y tablas externas) | Ninguna                      |
| Esquema `private`                                                           | No existe                    |
| Objetos y permisos previos en `private`                                     | Ninguno; esquema inexistente |
| `supabase_migrations.schema_migrations`                                     | No existe                    |
| Historial devuelto por API de migraciones                                   | Vacío                        |

Se observaron los esquemas estándar gestionados de Supabase, incluidos Auth, Storage, Realtime y Vault. No se consultaron sus datos. Ninguno será eliminado ni reemplazado por el SQL preparado.

El inventario utilizó exclusivamente el endpoint oficial `/database/query/read-only` y el GET de historial de migraciones, después de verificar el proyecto. No hubo intentos mediante otros tokens, endpoints de escritura o sesiones alternativas.

## Migración revisada

Archivo: `supabase/migrations/20261111000100_poetry_foundation.sql`.

SHA-256: `3c26003a7e168e2e995f708337fd5bee9d3a95ced3f16cece9a62804de3a418d`.

El hash actual coincide con el del archivo local cuando se obtuvo el inventario remoto. No se ha modificado el SQL.

Creará:

- `private` y las tablas vacías `public.admin_users`, `public.poems`, `public.publications`.
- Claves primarias, unicidad, restricciones y referencias a Auth/publicaciones; dos índices explícitos y cinco automáticos de claves/unicidad.
- `private.is_admin()` y `private.protect_poem_metadata()`.
- Un trigger de protección de metadatos/slug.
- RLS en las tres tablas, siete políticas y permisos mínimos explícitos.
- Tres comentarios de documentación.

El procedimiento de migración versionada también debe crear o mantener `supabase_migrations.schema_migrations` y registrar `20261111000100`. No basta ejecutar el SQL por una ruta que deje el historial sin registrar.

No hay DROP, TRUNCATE, DELETE de filas ni modificación de contenido existente. No hay INSERT de cuentas, publicaciones o poemas. La cláusula ON DELETE CASCADE de `admin_users` solo define comportamiento futuro si se elimina una identidad de Auth; no elimina datos al aplicar la migración.

La revocación de permisos de `private` ya no presenta el conflicto potencial identificado en la revisión anterior: el esquema no existe actualmente. Si el estado cambia antes de ejecutar, deberá repetirse el inventario. Las creaciones de tablas/funciones no llevan reemplazo; una colisión haría fallar la transacción en lugar de sobrescribir objetos.

## Qué falta antes de aplicar

1. **Exposición Data API:** confirmar en su configuración que `private` no está incluido en los esquemas expuestos. El catálogo inventariado no contiene esta configuración, y que el esquema aún no exista no prueba que esté excluido de una lista de exposición. No se han ampliado los permisos del token ni solicitado secretos JWT para comprobarlo. La propietaria puede verificar esa lista visualmente sin modificarla.
2. **Autorización expresa:** presentar y aprobar la ejecución concreta de esta versión, una vez resuelto el punto anterior.
3. **Credencial de escritura separada:** el token de lectura utilizado no permite aplicar la migración. Preparar una vía oficial versionada compatible con credenciales restringidas y autorización temporal suficiente, sin login global ni sustitución del token que utiliza Claude Code. No reutilizar sin más el procedimiento de la CLI global antigua ni actualizarla globalmente.
4. **Revalidación inmediata:** repetir identidad, hash, conflictos e historial justo antes de escribir.

## Verificación posterior prevista, todavía no realizada

Después de una futura ejecución autorizada, comprobar tablas, siete políticas RLS, privilegios efectivos, propietarios, funciones, trigger e historial registrado. Confirmar `private` fuera de Data API y ausencia de cuentas/contenidos creados. Repetir las pruebas de lectura pública y restringida diferenciando las pruebas locales de roles de futuros logins reales; no crear la administradora ni fixtures remotas sin autorización.

## Evidencia local

El comprobador aislado tiene 14 pruebas correctas: identidad, referencia, región, permisos, ausencia de fallback, entrada oculta, respuestas inesperadas y conflictos que obligan a revisión. El SELECT de inventario fue validado en PostgreSQL local desechable. TypeScript y ESLint de los archivos nuevos pasan.

Las 36 comprobaciones locales de permisos de la migración ya habían pasado en la preparación anterior. Esto no significa que la migración se haya aplicado o probado sobre tablas reales en Supabase: aún no existen allí.

No se han creado usuarios o tablas remotos, migrado poemas, desarrollado `/admin`, modificado Vercel o la web pública, hecho push ni fusionado main.

Referencias oficiales:

- https://supabase.com/docs/reference/api/v1-read-only-query
- https://supabase.com/docs/reference/api/v1-list-migration-history
- https://supabase.com/docs/guides/platform/personal-access-tokens
