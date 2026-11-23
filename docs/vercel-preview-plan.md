# Preparación del Preview de Trinity en Vercel

## Estado y límites

Rama: `prep/phase-1-supabase`. La propietaria ha validado personalmente /admin, los seis originales, Poesía, Publicaciones y la publicación/retirada de un poema nuevo. Esta etapa prepara y registra cambios locales. No autoriza todavía publicar un Preview, hacer push que lo active, modificar configuración remota ni variables de Production.

No hay `.vercel/project.json` que vincule este directorio con un proyecto. No se encontró una CLI Vercel instalada ni un conector Vercel disponible. Al abrir el dashboard en modo lectura apareció la pantalla de login; no se inició sesión ni se cambió nada. La URL/proyecto remoto y sus ajustes siguen pendientes de confirmar con la propietaria. No se afirma haber auditado la configuración privada que no fue accesible.

## Compatibilidad comprobada localmente

Se conserva TanStack Start + el plugin Lovable existente + Nitro. No se añade otro plugin ni se cambia de framework. La versión instalada de @lovable.dev/vite-tanstack-config es compatible con el procedimiento oficial de Vercel. El build local con preset vercel genera:

- Build Output API v3, `.vercel/output/config.json`.
- Función SSR `__server`, runtime nodejs24.x, handler index.mjs.
- Regla de enrutamiento al servidor para las páginas dinámicas y assets separados.
- HTML SSR completo, seis URLs originales y 404 correcto.

Se fija `engines.node = 24.x` en el package.json de esta rama, usando la misma versión mayor ya probada localmente. Vercel admite ese override por rama; no se modifica la versión Node del proyecto remoto ni el package.json de main. No se cambian dependencias ni el lockfile.

Comandos locales añadidos:

```sh
npm run build:vercel
npm run check:preview-build
```

El segundo comprueba estructura SSR, runtime y patrones de credenciales en los artefactos, sin desplegar. No contiene un comando de publicación.

## Comprobación remota pendiente, solo lectura

Antes de proponer un cambio remoto definitivo debe identificarse el proyecto Vercel que corresponde a Automatizza-es/brillacontrinity y revisar:

- URL, nombre y equipo/propietario del proyecto.
- Production Branch actual. Debe confirmarse que esta rama de preparación no la activa.
- Root Directory (la raíz que contiene package.json), framework detectado, Build Command, Output Directory y versión Node.
- Instalación compatible con el bun.lock existente, sin actualizar dependencias o regenerar otro lockfile.
- Overrides de salida estática: no debe servirse solo dist, porque se necesitan las funciones SSR de `.vercel/output`.
- Alcance de variables existentes mediante nombres y entornos, sin revelar sus valores.
- Deployment Protection y acceso de las personas que revisarán el Preview.
- Si un push a esta rama produce Preview automáticamente o hay restricciones/ignored build steps.

No modificar configuraciones globales de Build/Output/Node para corregir Preview sin evaluar si afectarían futuros builds de Production. Si existe una incompatibilidad, presentar su cambio exacto y alcance antes de tocarla.

## Variables propuestas: exclusivamente Preview

| Nombre                        | Uso                                                | Alcance propuesto                                         |
| ----------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| VITE_SUPABASE_URL             | Project URL del Supabase aprobado                  | Preview, preferiblemente limitada a prep/phase-1-supabase |
| VITE_SUPABASE_PUBLISHABLE_KEY | Publishable key del mismo proyecto                 | Preview, preferiblemente limitada a esa rama              |
| NITRO_PRESET                  | vercel, para hacer explícito el artefacto de build | Preview, limitada a esa rama si hace falta                |

Las dos variables VITE son públicas por diseño; no deben recibir nunca secret key, service_role, PAT, contraseña PostgreSQL ni contraseñas de usuarias. Sus valores reales se introducirán en la interfaz de Vercel después de autorización, sin pegarlos en el chat ni guardarlos en Git. Estarán disponibles durante build y ejecución de las funciones.

VERCEL_ENV es una variable del sistema que Vercel proporciona para identificar Preview. No se fija manualmente en `.env.example`, Production ni en el código. La comprobación tras publicar debe confirmar su efecto mediante X-Robots-Tag, sin volcar el entorno entero en registros.

No se necesita VITE_SITE_URL, una secret key de Supabase ni un token Vercel en el repositorio. No se realiza env pull, login, link ni cambios de sesiones globales durante esta preparación.

## Aislamiento de datos: decisión confirmada

La propietaria confirmó el 23 de noviembre de 2026 que Preview utilizará el proyecto Supabase actual brilla-con-trinity, referencia gwckhuwespupovgweahj, Frankfurt. No se creará otro proyecto. Preview separa código, URL y variables de Production; los poemas, cuentas y políticas se comparten con ese Supabase. La publicación y retirada del poema temporal cambiarán sus datos compartidos, sin alterar el despliegue de producción.

Las condiciones confirmadas son: no modificar los seis originales, la antología ni borradores anteriores; no modificar usuarios, tablas o políticas RLS; utilizar exclusivamente un poema temporal para publicar y retirar; mantener protección de acceso y noindex en Preview; no cambiar variables de Production ni fusionar main.

El plan de prueba utilizará un único poema temporal con slug inequívoco, comprobando antes que esté libre. Solo se editará su propio UUID durante la prueba: guardar borrador, publicar, comprobar la URL pública, retirar y confirmar 404. Se conservará después como borrador, sin borrados automáticos. No se tocarán originales, antología, otros borradores ni configuración de Supabase. Esta elección define el alcance del plan; la propietaria exige detenerse antes de cualquier cambio remoto y solicitar autorización de la ejecución concreta.

## Autenticación, cookies y rutas privadas

El flujo actual usa signInWithPassword y después una navegación relativa a /admin. No usa OAuth, magic links ni redirectTo, y no existe un callback de recuperación de contraseña. Por tanto no se propone cambiar ahora Site URL ni Redirect URLs de Supabase. No añadir comodines globales vercel.app ni cambiar el registro público desactivado. Si posteriormente se añade un flujo con redirección, deberá revisarse su callback exacto y autorizar su allowlist por separado.

Las cookies existentes son host-only (sin domain), SameSite=Lax y Secure en HTTPS; HTTP localhost sigue funcionando. Cada URL de Preview mantiene su propia sesión y no comparte cookies por dominio con Production. /admin y cada operación verifican identidad y pertenencia administrativa en servidor, usando el cliente de la usuaria bajo RLS. La consulta pública usa otro cliente anónimo, incluso si la visitante tiene sesión administrativa.

Se conserva CSRF same-origin, sin excepciones de origen para Vercel. Las respuestas con sesión y el contenido público dinámico mantienen no-store también en CDN. Deployment Protection de Vercel es una protección adicional del Preview, no sustituye Supabase Auth/RLS. Revisar la protección actual y proponer su activación solo para Preview si hace falta; no desactivarla ni emitir bypass tokens para facilitar pruebas.

## Indexación

Vercel añade noindex automáticamente a sus Preview por defecto. Además se ha preparado una defensa local explícita: en VERCEL_ENV=preview la frontera final del servidor añade `X-Robots-Tag: noindex, nofollow, noarchive` a éxitos, redirecciones, 404 y errores. Production y desarrollo conservan su comportamiento previo. /admin mantiene también su meta noindex habitual.

No se cambia el dominio público, no se asigna un dominio de Production al Preview y no se modifica robots.txt globalmente. Noindex regula buscadores; Deployment Protection regula quién puede abrir el Preview.

## Pruebas preparadas para después de autorizar y publicar

| Área             | Comprobación                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Destino          | Deployment identificado expresamente como Preview de esta rama/commit, sin promoción a Production                                                                                                                  |
| Protección       | Acceso de la revisora con el mecanismo Vercel aprobado; no desactivar protección para probar                                                                                                                       |
| Indexación       | X-Robots-Tag noindex en inicio, Poesía, Publicaciones, detalle, /admin, URL inexistente y errores                                                                                                                  |
| SSR/SEO          | Texto en HTML inicial, títulos/descripciones correctos; 404 para slug inexistente o retirado                                                                                                                       |
| Acceso privado   | Sin sesión aparece login; Trinity inicia sesión personalmente sin compartir credenciales; cierre de sesión elimina el acceso                                                                                       |
| Autorización     | Las denegaciones de usuarias no autorizadas siguen cubiertas por pruebas locales; no crear cuentas remotas nuevas sin autorización                                                                                 |
| Cookies/CSRF     | Cookies Secure en HTTPS, host-only y SameSite=Lax; POST desde otro origen rechazado; ningún dato privado en cachés compartidas                                                                                     |
| Poemas           | Seis originales y sus URLs, orden, versos, estrofas, fecha conocida y cuatro enlaces editoriales intactos                                                                                                          |
| Publicar/retirar | Solo si se autoriza expresamente, crear un poema temporal, guardar borrador, publicar, comprobar nueva URL, retirar y comprobar 404 y desaparición de enlaces; conservarlo como borrador, sin borrados automáticos |
| Errores          | Sin respaldo estático ni bibliotecas falsamente vacías; las caídas se prueban localmente, sin romper Supabase remoto                                                                                               |
| Móvil            | Anchos 390 y 768, menú, scroll, legibilidad, formulario de acceso y editor sin desbordamiento, acciones visibles y controles táctiles                                                                              |
| Production       | Variables, despliegue actual, rama y dominio público sin cambios                                                                                                                                                   |

No asumir que actualmente hay exactamente siete registros: Trinity puede haber creado más borradores durante sus pruebas. Se conserva todo dato previo.

## Verificaciones locales de esta preparación

- 121 pruebas Vitest satisfactorias, incluyendo noindex por entorno y preservación de status/headers/cookies.
- Compilación para Vercel y comprobación de 97 archivos del artefacto: estructura SSR correcta y sin patrones de claves secretas/PAT/material privado detectados.
- Smoke del artefacto real en el equipo con VERCEL_ENV=preview y lectura anónima de Supabase: diez rutas con SSR y noindex, más comprobaciones de no-store en 200/404. No crea sesiones ni modifica datos.
- Se conservan las pruebas previas de publicación/retirada aisladas y RLS local. No se han repetido escrituras reales para preparar Vercel.
- .env.local, informes locales y .vercel continúan ignorados. Solo se versiona .env.example con placeholders.

## Cambios remotos que se presentarían para autorización

1. Guardar las variables aprobadas exclusivamente en Preview y, cuando sea posible, para esta rama.
2. Mantener o activar la protección aprobada del Preview sin alterar Production.
3. Solo después de verificar la Production Branch y tener las variables correctas, hacer push de esta rama para que la integración Git cree el Preview, o acordar otra vía Preview explícita si el proyecto no usa Git. El push ya puede publicar; no se realiza durante la preparación.
4. Probar acceso de forma personal y ejecutar únicamente las comprobaciones autorizadas. Cualquier cambio de Node/Build/Output remoto o de Supabase adicional requiere presentar primero su efecto concreto.

La decisión sobre los datos está confirmada. Sigue pendiente identificar la URL exacta del proyecto Vercel y revisar su configuración mediante acceso de solo lectura. La preparación local no autoriza publicar ni cambiar configuración remota. No se ha hecho push, deploy, promoción, cambio de dominio ni merge.

## Fuentes oficiales consultadas

- https://vercel.com/docs/frameworks/full-stack/tanstack-start
- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/headers/response-headers
- https://vercel.com/docs/deployment-protection
- https://supabase.com/docs/guides/auth/redirect-urls

## Alcance de la próxima autorización

Tras identificar y revisar el proyecto, presentar juntos: nombres y alcance Preview de las variables (dos públicas de Supabase y preset Nitro), protección exacta de acceso existente o cambio propuesto solo para Preview, rama/commit y mecanismo que creará el despliegue, y el único poema temporal de prueba. No hacer push antes de esa autorización porque puede activar un despliegue. No cambiar Site URL ni Redirect URLs de Supabase para el login con contraseña actual. Los valores reales de las variables no se incluyen en este documento ni en respuestas del chat.

El mero nombre del repositorio GitHub no basta para asegurar cuál es el proyecto Vercel o su Production Branch. No se elige un proyecto por suposición ni se crea otro proyecto Vercel para sortear esa comprobación.
