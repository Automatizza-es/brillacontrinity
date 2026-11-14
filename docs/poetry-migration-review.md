# Revisión previa a la migración de poesía

Fecha: 14 de noviembre de 2026. Rama: `prep/phase-1-supabase`. Base revisada: `cf804d0`. Migración: `supabase/migrations/20261111000100_poetry_foundation.sql`.

**Estado: NO ejecutada en remoto. Identidad y catálogo remotos pendientes de comprobar. No solicitar/aplicar la migración hasta resolver estas comprobaciones y recibir autorización expresa.**

## Evidencia disponible y bloqueo

La rama estaba limpia al comenzar. La migración no se ha modificado. Su SHA-256 es `3c26003a7e168e2e995f708337fd5bee9d3a95ced3f16cece9a62804de3a418d`.

La CLI instalada es Supabase 2.116.0. Se consultó la lista de proyectos de la sesión actual y se compararon sus identificadores internamente con el origen de `.env.local`, sin mostrar los valores. La cuenta devuelve tres proyectos y **ninguno coincide con el nombre brilla-con-trinity ni con la referencia local**. Esto no demuestra que el proyecto no exista: demuestra que esta sesión no permite identificarlo. No hay un override de token o perfil en las variables de entorno del proceso.

La conexión pública de Auth validada anteriormente no acredita el nombre administrativo, región, plan, esquema existente ni permisos de mantenimiento. La publishable key no se usará para intentar obtener información privilegiada. Un error de tabla no expuesta en Data API tampoco demostraría que la tabla no existe, especialmente con exposición automática desactivada.

Se necesita una sesión CLI de la propietaria con acceso al proyecto correcto, o una sesión de dashboard autorizada para inspección. Iniciar `supabase login` personalmente con esa cuenta, sin usar `--token` en comandos ni compartir tokens o contraseñas por chat. Una vez disponible el acceso, repetir la identificación exacta de referencia, nombre, región Frankfurt (`eu-central-1`) y plan Free. No se ha cambiado la sesión ni se han solicitado credenciales en esta revisión.

## Compatibilidad de la migración

El SQL utiliza características estándar disponibles en PostgreSQL de Supabase: UUID, claves foráneas a `auth.users`, `auth.uid()`, roles `anon`/`authenticated`, RLS, índices parciales y triggers. No requiere extensiones adicionales, servicios de pago ni datos iniciales.

La configuración indicada por la usuaria —Data API activa, exposición automática desactivada y RLS automático activo— es compatible con los GRANT/REVOKE y ENABLE ROW LEVEL SECURITY explícitos. Es una conclusión sobre el SQL y esa configuración declarada, **no una inspección del proyecto remoto todavía**.

Debe aplicarla un rol de mantenimiento de confianza; la aplicación no debe recibir privilegios de propietario ni una clave service_role. La función SECURITY DEFINER debe quedar bajo ese propietario, con search_path vacío. `private` debe permanecer fuera de los esquemas expuestos por Data API.

La consulta de inventario se ha validado en PostgreSQL local desechable antes y después de aplicar la migración. La migración local y las 36 comprobaciones de permisos también pasan. No se ha ejecutado SQL en Supabase remoto.

## Objetos que creará

| Objeto                 | Detalle                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Esquema `private`      | Se crea solo si no existe; se ajustan sus permisos.                                                                                                               |
| `public.admin_users`   | Autorización por UUID de Auth, clave primaria y referencia a la identidad. Sin usuarios insertados.                                                               |
| `public.publications`  | Metadatos editoriales, UUID, slug único y restricciones. Sin publicaciones insertadas.                                                                            |
| `public.poems`         | Texto, título, fechas opcionales, estado, slug, orden y referencia editorial. Sin poemas insertados.                                                              |
| Índices                | Dos explícitos: orden de publicados y referencia editorial; cinco índices automáticos de claves primarias/unicidad.                                               |
| Funciones              | `private.is_admin()` y `private.protect_poem_metadata()`.                                                                                                         |
| Trigger                | `protect_poem_metadata` en `poems`, para proteger slug y marcas internas.                                                                                         |
| RLS                    | Activado explícitamente en las tres tablas.                                                                                                                       |
| Políticas              | Siete: lectura de pertenencia propia, lectura editorial pública, lectura anónima de publicados, lectura autenticada y tres operaciones administrativas de poemas. |
| Permisos y comentarios | GRANT/REVOKE explícitos y tres comentarios descriptivos.                                                                                                          |

La CLI también mantiene el historial oficial `supabase_migrations.schema_migrations`, creándolo si no existe, y registra la versión aplicada. Es un objeto de control adicional al SQL de la aplicación.

## Operaciones y precauciones

No hay DROP, TRUNCATE, borrado de filas, modificación de contenidos existentes ni INSERT de poemas o usuarios. Todo el archivo está delimitado por BEGIN/COMMIT; si falla, la transacción de aplicación se revierte.

La cláusula ON DELETE CASCADE de `admin_users` define el comportamiento futuro si se elimina una identidad de Auth; no elimina ninguna identidad o fila durante esta migración. La relación con publicaciones usa ON DELETE RESTRICT.

**Precaución pendiente:** `CREATE SCHEMA IF NOT EXISTS private` permite reutilizar un esquema existente, y a continuación `REVOKE ALL ON SCHEMA private FROM public, anon, authenticated` puede modificar accesos previos. Por eso no se puede confirmar todavía que no habrá impacto sobre otros usos. Si `private` ya existe, inspeccionar sus objetos, propietario y permisos; si tiene un uso previo, detenerse y revisar el alcance antes de autorizar. Las tablas y funciones se crean sin reemplazo, por lo que una colisión causa error en lugar de sobrescribir datos.

## Comprobación de catálogo preparada

`supabase/checks/poetry-preflight.sql` contiene únicamente una transacción READ ONLY con consultas a catálogos. No devuelve contenido de filas ni credenciales. Comprueba:

- Versión de PostgreSQL y contratos de Auth/UUID.
- Roles previstos.
- Existencia de las tres relaciones objetivo, incluidas posibles colisiones de nombres.
- Existencia, propietario y permisos de los esquemas public/private.
- Inventario de relaciones public/private y funciones de private.
- Configuración pgrst.db_schemas cuando aparece en los ajustes de roles.
- Existencia del historial de migraciones.

Si las tres tablas no existen, no puede haber datos en ellas que perder. Si alguna existe, no aplicar el archivo: revisar su esquema y realizar conteos exactos de solo lectura sin extraer datos personales. Una lista vacía de ajustes pgrst en el catálogo **no certifica** que private no esté expuesto; comprobar también Data API en el dashboard/Management API.

## Procedimiento oficial preparado, todavía NO ejecutado

1. Autenticarse personalmente en la cuenta que tiene el proyecto y volver a listar proyectos. Comparar referencia exacta con `.env.local`, nombre, región y plan. Si no coinciden, detenerse.
2. Revisar el inventario de solo lectura y el historial remoto existente. El comando disponible en esta CLI es `supabase db query --project-ref "$TRINITY_PROJECT_REF" --file supabase/checks/poetry-preflight.sql`; la variable solo se establecerá en la sesión después de verificar el destino. No incluir contraseñas en argumentos ni versionar credenciales.
3. Confirmar que no hay colisiones ni uso previo de private. Si existe historial remoto, inspeccionarlo sin usar migration repair para ocultar diferencias.
4. Preparar configuración local de CLI con `supabase init` solo si es necesaria; revisar el archivo generado y no incluir secretos, seeds ni roles adicionales. No hacer pull/reset del esquema remoto para resolver automáticamente diferencias.
5. Presentar al usuario la identidad comprobada, inventario y plan final. Mantener la pausa antes de cualquier aplicación.
6. Para la previsualización oficial, utilizar `supabase db push --project-ref "$TRINITY_PROJECT_REF" --skip-vault --dry-run`, con la identidad ya comprobada. Confirmar que únicamente aparece la versión `20261111000100`. No usar include-seed, include-roles, include-all, reset ni repair.
7. **Solo después de la autorización expresa**, aplicar mediante el mismo `db push`, quitando únicamente `--dry-run`, manteniendo `--skip-vault` y la referencia verificada. La CLI gestionará el historial. No ejecutar únicamente el archivo a mano dejando el historial sin registrar.
8. Verificar tablas, restricciones, propietarios, funciones, trigger, siete políticas y privilegios efectivos. Comprobar private fuera de Data API y ausencia de usuarios/contenidos creados.
9. Repetir comprobaciones de acceso público y restringido. Como no se autoriza crear una administradora ni cuentas de prueba, no afirmar que se ha hecho un login remoto administrativo: distinguir pruebas SQL de roles dentro de una transacción reversible (solo si se autorizan fixtures) de pruebas Auth reales posteriores. Mantener las pruebas locales ya existentes como evidencia separada.

La sesión que ejecute CLI necesita privilegios de mantenimiento, diferentes de la publishable key usada por la web. No hace falta añadir secretos privilegiados a `.env.local` ni a la aplicación.

## Punto de parada y siguientes pasos

Se deja preparada la consulta de inventario y este informe. **No se ha confirmado aún la identidad remota ni la ausencia de tablas/datos, y no se ha realizado un dry-run remoto.** La siguiente acción requerida es dar acceso de lectura a la cuenta/proyecto correcto. Después se completará el inventario y se pedirá autorización para aplicar la migración; esta revisión no la sustituye.

No se han creado cuentas, migrado poemas, desarrollado `/admin`, cambiado Vercel o la web pública, hecho push ni fusionado main.

Referencias oficiales consultadas:

- https://supabase.com/docs/guides/deployment/database-migrations
- https://supabase.com/docs/reference/cli/supabase-db-push
- https://supabase.com/docs/reference/api/v1-list-all-projects
