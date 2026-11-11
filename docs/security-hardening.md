# Correcciones de seguridad antes de conectar Supabase

Revisión: 11 de noviembre de 2026. Rama: `prep/phase-1-supabase`.

Este documento actualiza los resultados históricos de `phase-1-preparation.md`. No se ha conectado Supabase remoto, aplicado SQL remoto, modificado Vercel ni realizado despliegues. Las pruebas de permisos usan exclusivamente PostgreSQL desechable local. No se han modificado el diseño, las rutas públicas ni los textos originales.

## Actualizaciones selectivas

Se ha mantenido el framework y las versiones mayores. Se ha conservado el lockfile Bun y su protección de antigüedad mínima; no se han añadido excepciones. El comando de actualización ha resuelto las siguientes versiones compatibles con los rangos existentes:

| Paquete                        | Antes  | Después |
| ------------------------------ | ------ | ------- |
| Vite                           | 8.1.5  | 8.1.6   |
| Vitest y sus paquetes internos | 4.1.11 | 4.1.12  |
| shell-quote                    | 1.10.0 | 1.12.0  |
| launch-editor                  | 2.14.1 | 2.14.2  |
| brace-expansion, familia 1     | 1.1.16 | 1.1.21  |
| brace-expansion, familia 5     | 5.0.8  | 5.0.12  |
| js-yaml                        | 4.3.0  | 4.3.2   |
| nanoid                         | 3.3.16 | 3.3.20  |
| source-map-js                  | 1.2.1  | 1.2.2   |
| seroval                        | 1.6.8  | 1.8.0   |
| Zod transitivo de TanStack     | 4.6.5  | 4.6.7   |

Los cambios directos en `package.json` se limitan a Vite y Vitest. Zod directo permanece en 3.25.76. La actualización también reorganiza la deduplicación de picomatch 4.0.5/4.0.7, versiones ya presentes en el lockfile anterior. No se han actualizado React, Supabase ni TanStack a otras versiones.

## Cookies y respuestas de sesión

`cookie-options.ts` determina las opciones a partir de la URL de la página, no de la API Supabase. Esto permite usar localhost por HTTP aunque la API remota sea HTTPS:

- HTTPS, incluido HTTPS local: `Secure=true`.
- HTTP localhost, 127.0.0.1 e IPv6 ::1: `Secure=false`.
- Cualquier otro host: `Secure=true`, incluso si llega como HTTP, para no relajar la protección fuera de desarrollo local.
- `SameSite=Lax`, `Path=/`, sin ampliar el dominio de las cookies.

El cliente de navegador utiliza su origen actual. El servidor utiliza la URL de petición, contempla el protocolo HTTPS del proxy y no utiliza `x-forwarded-host` para decidir si se trata de localhost. Las mismas opciones se aplican a cada parte de cookie y a su eliminación. Se conserva el modelo de sesiones oficial de Supabase, con cookies accesibles al cliente de navegador para mantener la sesión, sin imponer HttpOnly de forma incompatible.

El cliente de servidor fija estas cabeceras antes de usar la sesión y después de escribir cookies:

```text
Cache-Control: private, no-store
CDN-Cache-Control: no-store
Vercel-CDN-Cache-Control: no-store
Pragma: no-cache
Expires: 0
```

La prueba de integración detectó que la versión instalada de TanStack puede descartar cabeceras del contexto al devolver una respuesta HTTP no exitosa. Por eso `src/server.ts` aplica también `protectSessionResponse` sobre la respuesta final, incluidos errores normalizados y fallos del servidor.

La protección final cubre peticiones con cookies de Auth Supabase, Authorization, respuestas que emiten cookies, respuestas ya marcadas no-store y los espacios reservados `/admin` y `/_serverFn`. Esto no crea rutas ni endpoints: prepara la política del servidor para el panel futuro. No se altera la respuesta pública anónima cuando no hay ninguno de esos indicadores. No debe configurarse una regla de CDN externa que fuerce almacenamiento ignorando estas cabeceras.

## Verificaciones realizadas

- `npm run test:db:local`: 36 comprobaciones de permisos correctas, con fixtures sintéticas y contenedor eliminado al terminar. No hay cambios en la migración SQL ni en sus políticas.
- `npm test`: 34 pruebas correctas, en tres archivos.
- `npx tsc --noEmit`: correcto.
- ESLint dirigido a todos los archivos TypeScript/JavaScript modificados o nuevos: correcto.
- Formato de `package.json` y `git diff --check`: correctos.
- `npx bun install --frozen-lockfile`: reproducible, sin cambios.
- `NITRO_PRESET=vercel npm run build`: correcto; solo genera artefactos locales.
- `node scripts/check-vercel-ssr.mjs`: cinco rutas públicas con estado 200 y SSR; además respuestas con cookie de sesión con estados 200 y 404 verificadas con las tres cabeceras no-store en el artefacto real de Vercel.

Las pruebas de integración emplean el adaptador real de peticiones/respuestas TanStack; solo sustituyen la creación del cliente Supabase para no contactar Auth. Verifican Secure, localhost, protocolo del proxy, cookies fragmentadas, eliminación, respuestas sin renovación, denegaciones, errores y redirecciones. No se ha validado todavía una sesión contra Auth remoto ni un CDN desplegado.

El lint global conserva los errores de formato preexistentes descritos en la preparación inicial; no se han reformateado páginas públicas fuera de alcance.

## Auditoría final y riesgos pendientes

La salida de `bun audit --json` se conserva en `security-audit.json`. Resultado: **2 avisos: 0 críticos, 1 alto y 1 moderado**, frente a los 28 originales. El comando termina con código 1 porque siguen existiendo esos dos avisos; no es un fallo al ejecutar la auditoría.

1. **Zod 3.25.76 — alto, GHSA-mrhx-c7xc-m3w5.** Dependencia directa, compartida por React Hook Form resolvers. El aviso contempla agotamiento de memoria al validar colecciones enormes. El único esquema propio actual valida las dos cadenas de configuración, no colecciones de entrada pública, y todavía no hay formulario ni panel conectado. No se ha identificado una ruta explotable en el código actual. El arreglo publicado parte de Zod 4.6.6: se requiere una migración mayor separada, no autorizada en esta corrección. Antes de incorporar nuevos endpoints que validen entradas se debe resolver esta dependencia o establecer una solución revisada, con límites de tamaño del cuerpo antes de validarlo. Las copias Zod 4 de TanStack sí han quedado corregidas.
2. **minimatch 10.2.6 — moderado, GHSA-g3hv-75wg-m249.** Transitiva de typescript-eslint, uso de desarrollo. Un patrón controlado por atacante con optimización elevada puede agotar recursos. No se aceptan patrones de visitantes ni se incluye esta herramienta en el runtime público. La corrección comienza en 11.0.1; no se fuerza una versión mayor incompatible con el consumidor. Se revisará mediante una actualización compatible de typescript-eslint cuando la admita, o en una tarea específica.

No se considera que la auditoría esté completamente limpia. Estos riesgos no bloquean preparar una conexión local de revisión, pero deben permanecer en el seguimiento y resolverse o mitigarse explícitamente antes de habilitar funcionalidades públicas nuevas.

## Estado para el siguiente paso

La base técnica está preparada para configurar la conexión de desarrollo con el proyecto Free de Frankfurt, tras revisión del usuario. Necesitaremos Project URL y publishable key, guardadas en `.env.local` ignorado por Git. No se necesita una clave de servicio ni contraseña de base de datos en la aplicación. Aplicar la migración remota, crear/autorizar la administradora y probar Auth/Data API reales siguen siendo pasos posteriores sujetos a autorización. Los ajustes privados de Vercel y la validación del CDN también siguen pendientes antes de desplegar.

Fuentes oficiales:

- https://bun.sh/docs/pm/cli/update
- https://supabase.com/docs/guides/auth/server-side/advanced-guide
- https://github.com/advisories/GHSA-mrhx-c7xc-m3w5
- https://github.com/advisories/GHSA-g3hv-75wg-m249
