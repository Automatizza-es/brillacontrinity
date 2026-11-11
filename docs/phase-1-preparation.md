# Preparación de fase 1 — Brilla con Trinity

Rama local: `prep/phase-1-supabase`. Base: `85449a1`. Revisión: 11 de noviembre de 2026.

## Alcance y estado

Preparación local exclusivamente. No se han aplicado migraciones remotas, configurado usuarios reales, cambiado Vercel, realizado despliegues ni enviado la rama a GitHub. No se ha añadido `/admin`, importado poemas ni desarrollado contactos o Resend. Las rutas, estilos y contenidos públicos permanecen intactos. Ninguna ruta importa aún los nuevos clientes Supabase.

Fases acordadas: gestor de poemas; formulario seguro sin dependencia de Resend; bandeja privada pendiente/atendido y consentimiento comercial separado; notificaciones Resend cuando esté disponible el dominio. Esta preparación solo cubre la primera.

## Base de datos

`supabase/migrations/20261111000100_poetry_foundation.sql` crea las tres tablas dentro de una transacción, sin datos iniciales ni credenciales:

- `admin_users`: autorización manual mediante UUID de `auth.users`; borrado en cascada si se elimina la identidad. Solo se puede consultar la propia pertenencia. Ningún rol de aplicación puede insertar, editar o eliminar autorizaciones.
- `publications`: metadatos editoriales existentes, portada como URL, enlaces opcionales y slug único. Lectura pública. Sin escritura desde clientes en esta fase; no hay gestor editorial autorizado todavía.
- `poems`: título, `body` de texto plano sin normalización, descripción, fecha estructurada opcional y fecha original textual, slug único, borrador/publicado, fecha web conocida opcional, primera publicación en esta base, orden, publicación asociada y marcas temporales.

La relación editorial tiene una única fuente (`poems.publication_id`), sin duplicar listas de slugs. `ON DELETE RESTRICT` impide borrar una publicación asociada. Se conserva el orden mediante `sort_order`. No se inventará una fecha web histórica: `published_at` puede ser NULL. `first_published_at` es una marca interna de la primera publicación en esta base, y no se muestra como fecha histórica.

Restricciones: slug ASCII de hasta 160 caracteres; título no vacío de hasta 300; texto hasta 200.000 caracteres; descripción hasta 2.000; estados cerrados; contenido no vacío al publicar; claves foráneas e índices. No se recorta el texto almacenado. El trigger impide cambiar el slug tras publicar, aunque vuelva a borrador, y protege las marcas internas contra su eliminación o alteración desde el cliente.

RLS se activa explícitamente y los permisos se revocan y conceden de forma explícita: no se depende de los ajustes automáticos del dashboard. `anon` solo puede leer poemas publicados y publicaciones. `authenticated` tiene esos mismos derechos, más CRUD de poemas únicamente si figura en `admin_users`. No se conceden TRUNCATE, REFERENCES, TRIGGER ni escrituras en las otras dos tablas.

`private.is_admin()` es una función SECURITY DEFINER con `search_path` vacío y referencias calificadas. Su único resultado es un booleano sobre el usuario actual; no acepta un UUID ajeno. Se revoca EXECUTE público y solo se permite a `authenticated`. Evita recursión RLS. El esquema `private` debe permanecer fuera de los esquemas expuestos por Data API. Las tablas y la función deben pertenecer al rol de mantenimiento de confianza que aplique la migración, nunca a un rol cliente.

La configuración indicada del proyecto (Data API activa, exposición automática desactivada y RLS automático activo) es compatible. Al autorizar la aplicación remota se comprobará que `public` está entre los esquemas expuestos y que los GRANT explícitos permiten las operaciones previstas. No se activará la exposición automática global para resolver problemas de permisos.

## Conexión preparada

- `src/lib/supabase/config.ts`: validación diferida; acepta HTTPS y HTTP solo para localhost; exige una clave `sb_publishable_`; rechaza claves privilegiadas y ejemplos. Los errores no incluyen los valores.
- `client.ts`: cliente de navegador oficial, creado al utilizarlo, no al importar.
- `server.ts`: cliente por petición con cookies `getAll`/`setAll`, propagación de todas las partes de cookies y de las cabeceras contra caché suministradas por Supabase SSR. Toda respuesta que utilice este cliente es `private, no-store`.
- `requirePoetryAdmin`: identidad verificada con `auth.getUser()` y pertenencia comprobada en base de datos. Devuelve el cliente con la sesión del usuario, sujeto a RLS. Falla de forma cerrada si no hay identidad, autorización o la consulta falla.

Las futuras llamadas desde loaders deben envolverse en `createServerFn`; no importar lógica de servidor directamente en componentes ni instanciar clientes de sesión globales. Cada escritura deberá validar los campos con Zod, ejecutar el guard y conservar la protección CSRF ya presente en `src/start.ts`. No se han creado endpoints RPC en esta preparación. Los tipos de base de datos se generarán después de validar/aplicar el esquema en un entorno autorizado; no hay tipos generados que aparenten proceder del proyecto remoto.

Dependencias añadidas: `@supabase/supabase-js` y `@supabase/ssr`, con el `bun.lock` existente actualizado. No se ha añadido un segundo lockfile ni actualizado el resto de dependencias del lockfile.

## Vercel: evidencia y límites

La URL pública `/poesia/atrevete-a-brillar` respondió 200 con `server: Vercel`; el texto completo y el título específico estaban en el HTML inicial. No se encontró canonical en esa respuesta. No se cambió el SEO.

El paquete instalado `@lovable.dev/vite-tanstack-config@2.26.5` utiliza `defaultPreset: cloudflare-module`, no un preset fijo fuera del entorno Lovable: permite selección de Nitro por entorno. Por tanto, la mención a Cloudflare en el comentario de Vite no implica incompatibilidad con Vercel. No se añaden plugins duplicados ni se modifica `vite.config.ts`.

La compilación habitual pasa con el destino predeterminado Cloudflare. La compilación local `NITRO_PRESET=vercel npm run build` también pasa, genera `.vercel/output/config.json` con Build Output API v3, enrutamiento al servidor y función `nodejs24.x`. Esta variable solo se usó para el proceso local, no se cambió ninguna variable de Vercel. El artefacto local sirve las cinco rutas comprobadas con estado 200 y HTML SSR, sin variables Supabase.

No se ha accedido al dashboard privado: siguen pendientes la comprobación del framework seleccionado, versión Node, comando de instalación/compilación, rama de producción, carpeta raíz, overrides de salida y registros del último despliegue. Tampoco se afirma que el artefacto de producción proceda exactamente del commit auditado. Se revisará todo antes del futuro despliegue de prueba; no hace falta cambiar la configuración pública ahora.

## Pruebas reproducibles

```sh
npx bun install --frozen-lockfile
npx tsc --noEmit
npm test
npm run test:db:local
npm run build
NITRO_PRESET=vercel npm run build
node scripts/check-vercel-ssr.mjs
npx eslint src/lib/supabase src/test/supabase-foundation.test.ts scripts/*.mjs
```

El comando de base de datos requiere Docker y utiliza `postgres:17-alpine`, sin publicar puertos, con un nombre temporal, sin volumen persistente ni URL remota, y elimina el contenedor al terminar. `local-bootstrap.sql` simula únicamente los roles y el contrato `auth.users`/`auth.uid()` de Supabase. NO es una migración de aplicación y NO debe ejecutarse en Supabase. `permissions.sql` usa fixtures sintéticas, cambia los roles de PostgreSQL y revierte todos los datos de prueba.

Las pruebas SQL cubren visitantes, usuarios autenticados no autorizados, administradores, autoautorización bloqueada, bloqueo de TRUNCATE, lectura y escritura de borradores, publicación, retirada, borrado, preservación de espacios, integridad referencial, unicidad, estados inválidos, texto vacío, bloqueo permanente de slug y revocación inmediata con la misma identidad. Han pasado 36 comprobaciones en PostgreSQL local.

Vitest: 12 pruebas en total, incluida la prueba existente. Comprueban configuración sin filtrado de claves, cookies fragmentadas y cabeceras de caché, creación de cliente por petición y autorización que falla de forma cerrada. TypeScript, ESLint de los archivos nuevos y ambas compilaciones pasan. El script SSR comprueba inicio, Poesía, un poema, Publicaciones y Contacto.

El lint global de fuentes (excluyendo artefactos `.vercel`/`.wrangler`) detecta 86 errores de formato y 6 avisos en archivos preexistentes; no se han reformateado las páginas públicas para resolverlos. La ejecución sin exclusiones se detuvo al recorrer los artefactos generados de Vercel. El lint dirigido a todos los archivos nuevos sí pasa.

`bun audit` informa de 28 avisos en el árbol ya fijado por el lockfile original (1 crítico, 14 altos, 12 moderados y 1 bajo). Incluye herramientas de desarrollo y dependencias transitivas de TanStack. Ninguno de los paquetes señalados pertenece a las dependencias Supabase añadidas. No se aplicó una actualización masiva fuera de alcance; se debe revisar y resolver el inventario antes del futuro despliegue. Las versiones originales del lockfile no se han cambiado en esta rama.

Estas pruebas no sustituyen las futuras pruebas de Auth real, renovación de sesión, Data API, permisos de exposición y navegación en el entorno de prueba Supabase/Vercel.

## Datos y configuración segura para la siguiente etapa

No hacen falta credenciales para revisar esta preparación.

Cuando se autorice conectar un entorno, necesitaremos:

1. Project URL de `brilla-con-trinity` y su publishable key (`sb_publishable_...`), disponibles en Connect/API Keys. Son los dos valores públicos de conexión; la seguridad depende de RLS, no de ocultar esta clave.
2. Email de la administradora y, una vez creada manualmente en Auth, su UUID. La contraseña la establece la usuaria por un flujo seguro y nunca se envía por chat ni se incluye en SQL versionado.
3. URL exacta del entorno de prueba para configurar Site URL y la lista restringida de redirects de Auth. Desactivar registro público antes de habilitar el panel. Validar también la recuperación de contraseña y los requisitos del correo de Auth; no depende del futuro formulario ni de sus avisos Resend.

Copiar `.env.example` a `.env.local` y rellenar únicamente `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. `.env.local` está ignorado. Las variables `VITE_*` son públicas y se incorporan al navegador durante la compilación; nunca poner ahí `sb_secret_*`, `service_role`, contraseñas de PostgreSQL o tokens personales.

Más adelante se introducirán los mismos dos valores en el ámbito Preview del proyecto Vercel autorizado y, solo tras aprobación de producción, en Production. Los valores deben estar disponibles en compilación y runtime. No reutilizar datos reales de un futuro formulario en pruebas. La aplicación de la migración se realizará en una sesión de mantenimiento autorizada con credenciales fuera del repositorio; la aplicación web no necesita una clave de servicio ni la contraseña de la base de datos.

## Próximos pasos sujetos a revisión

1. Revisar esta rama, las políticas y el modelo, en particular las fechas y el bloqueo de slug.
2. Revisar los ajustes privados de Vercel sin modificarlos y elegir el entorno de prueba.
3. Con autorización posterior, aplicar el esquema al entorno elegido y comprobar los permisos mediante Data API y Auth reales.
4. Configurar la cuenta manual y su autorización; construir `/admin` en una etapa posterior.
5. Importar y cotejar los seis poemas solo tras autorización específica; después conectar las páginas públicas conservando URLs y diseño.
6. Preparar y revisar un despliegue de prueba antes de cualquier cambio de producción.

## Referencias oficiales consultadas

- https://supabase.com/docs/guides/getting-started/quickstarts/tanstack
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://vercel.com/docs/frameworks/full-stack/tanstack-start
- https://tanstack.com/start/latest/docs/framework/react/guide/hosting
