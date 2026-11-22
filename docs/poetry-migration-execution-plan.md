# Ejecución de poetry_foundation completada

## Destino y archivo definitivo

- Rama: `prep/phase-1-supabase`.
- Proyecto: `brilla-con-trinity`.
- Referencia pública: `gwckhuwespupovgweahj`.
- Región: Frankfurt, `eu-central-1`.
- Archivo: `supabase/migrations/20261121175059_poetry_foundation.sql`.
- Versión registrada por Supabase: `20261121175059`.
- SHA-256: `3c26003a7e168e2e995f708337fd5bee9d3a95ced3f16cece9a62804de3a418d`.

La API oficial aplicó una sola vez el SQL autorizado el 21 de noviembre de 2026. El endpoint generó la versión remota; el archivo local se renombró el 22 de noviembre, conservando exactamente los mismos bytes. Git conserva la trazabilidad del nombre anterior. No se ha reparado ni modificado el historial remoto.

## Procedimiento utilizado y aislamiento

Se utilizó `POST /v1/projects/{ref}/database/migrations` con `name: poetry_foundation` y el SQL revisado. El PAT temporal se introdujo mediante entrada oculta y se utilizó únicamente en SUPABASE_ACCESS_TOKEN dentro del proceso. Sus permisos fueron Project Settings Read, Database Read y Migrations Read & Write. No se utilizó una contraseña PostgreSQL, secret key, login, link ni la sesión global de Supabase.

El endpoint admite query/name/rollback, pero no una versión elegida por el cliente. Por eso se autorizó adoptar su versión generada en el nombre del archivo local. No se utilizó PUT de historial, migration repair ni una entrada inventada.

El comando de aplicación conserva un registro local previo al intento y bloquea nuevas aplicaciones si existe ese registro. Además, su inventario previo exige que no existan tablas, esquema private ni migraciones: el proyecto ya aplicado no cumple esa condición. **No volver a ejecutar `apply:poetry-migration`.** Los informes locales están ignorados por Git y no contienen tokens.

## Objetos verificados

- Tablas vacías public.admin_users, public.poems y public.publications, con RLS en las tres.
- Siete políticas; permisos efectivos mínimos de anon y authenticated.
- Esquema private, dos funciones y un trigger de protección de metadatos/slug.
- Claves, restricciones y dos índices explícitos, además de los índices automáticos.
- Entrada poetry_foundation en el historial, con sentencias coincidentes con el SQL revisado.

Ningún cliente tiene permisos de escritura en admin_users. Los visitantes solo pueden leer poemas publicados y publicaciones. Las operaciones de administración de poemas requieren pertenencia a admin_users; no existe todavía ninguna administradora. No se han migrado poemas ni publicaciones.

## Evidencia y cierre

La reconciliación del 22 de noviembre a las 08:25:35 UTC verificó nuevamente identidad, versión, historial, catálogo, funciones, políticas y permisos mediante operaciones de lectura. Resultado: VERIFIED_READ_ONLY, sin incidencias; tablas vacías confirmadas por un lector con BYPASSRLS. La comprobación anterior de Data API rechazó private con PGRST106 y el acceso anónimo a admin_users con 42501.

La alerta inicial del comprobador fue un problema de interpretación de name[] en la respuesta de la API. Se corrigió y se añadió una prueba con el formato real, sin modificar el SQL. El detalle está en [poetry-migration-reconciliation.md](poetry-migration-reconciliation.md).

Este cierre solo cambia archivos locales, ejecuta pruebas locales y registra un commit en la rama de preparación. No cambia Supabase remoto, Vercel, la web pública ni main. No crea la cuenta administradora ni desarrolla /admin.

## Referencias oficiales del procedimiento utilizado

- https://supabase.com/docs/reference/api/v1-apply-a-migration
- https://supabase.com/docs/reference/api/v1-get-a-migration
- https://supabase.com/docs/reference/api/v1-list-migration-history
- https://supabase.com/docs/guides/platform/personal-access-tokens
