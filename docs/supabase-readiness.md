# Revalidación antes de conectar Supabase Free

Rama: `prep/phase-1-supabase`. Fecha: 11 de noviembre de 2026.

## Resultado

La configuración local está preparada para Project URL y publishable key del proyecto `brilla-con-trinity`, Free, Frankfurt. No se ha realizado ninguna conexión remota, aplicado SQL remoto, configurado Vercel, desplegado, creado el panel o importado poemas. Esta revisión no cambia la autorización pendiente para esas tareas.

Los parches de dependencias y la configuración Secure/no-store ya se habían aplicado en `ab045bf`. Se ha comprobado su estado: `bun update` dirigido a los paquetes auditados, en modo dry-run, no encuentra nuevas actualizaciones compatibles. No se ha modificado `package.json` ni `bun.lock` en esta revalidación. Se conservan todos los parches descritos en `security-hardening.md`, incluida la actualización de las copias Zod 4 transitivas; la dependencia directa sigue siendo Zod 3.

## Corrección adicional: privacidad de diagnósticos

La implementación anterior de captura de errores podía registrar el mensaje, la pila, cadenas de causas y objetos arbitrarios completos. Además, la telemetría de errores podía transmitir el error original y su contexto, y el límite raíz registraba el error sin filtrar en el navegador.

Se ha sustituido esa serialización por `safeErrorDiagnostic`: solo permite categorías conocidas, estados HTTP 400–599 y una lista cerrada de códigos de base de datos. No serializa mensajes, pilas originales, causas, credenciales, objetos de petición, URLs ni contexto arbitrario. Los argumentos no estructurados de `console.error` en el servidor se omiten, y el almacenamiento temporal de errores conserva únicamente la descripción saneada.

`reportLovableError` entrega una descripción saneada, nunca el objeto original. El límite raíz usa el mismo diagnóstico para la consola. Su cambio no altera el JSX renderizado, estilos, navegación ni definición de rutas; únicamente se reformatearon dos expresiones JSX para cumplir el lint del archivo modificado.

Esta decisión reduce el detalle de depuración en los logs a cambio de no depender de patrones que pueden pasar por alto contraseñas desconocidas. Las pruebas cubren mensajes, causas, objetos con tokens, cadenas, getters que lanzan errores, contexto de telemetría y llamadas reales al adaptador de console.error. No existen credenciales reales en las pruebas.

El HTML genérico de error no incorpora detalles de excepciones. Las utilidades Supabase no registran ni devuelven tokens; la configuración produce errores sin incluir los valores recibidos. No se han creado endpoints de autenticación ni de edición que puedan devolver sesiones.

## Sesiones y caché revalidadas

Se mantienen las opciones explícitas `Secure` en HTTPS y la excepción de HTTP únicamente en loopback local, basadas en el origen de la página y no en la URL de Supabase. Se conservan SSR, cookies fragmentadas, verificación de identidad, autorización por UUID y RLS.

Se mantiene `Cache-Control: private, no-store` y cabeceras equivalentes para CDN y Vercel. La protección se aplica tanto al cliente SSR como a la salida final del servidor, incluyendo errores y redirecciones. No se ha modificado el código de esa protección en esta revisión.

No se afirma que una sesión remota real o una regla del CDN desplegado esté probada: todavía no se ha conectado Auth ni desplegado esta rama.

## Verificaciones realizadas

- Vitest: **43 pruebas correctas**, cuatro archivos, nueve pruebas nuevas de privacidad de errores.
- Permisos RLS: **36 comprobaciones correctas**, en PostgreSQL local desechable con fixtures sintéticas. El contenedor se elimina después; no se ha aplicado la migración al proyecto de Frankfurt.
- `npx tsc --noEmit`: correcto.
- ESLint de todos los archivos TS/TSX/JS modificados o nuevos: correcto.
- Compilación local `NITRO_PRESET=vercel npm run build`: correcta.
- SSR del artefacto Vercel: diez rutas públicas con estado 200, incluidos los seis poemas originales; comprobación adicional de no-store en respuestas con cookie sintética con estados 200 y 404.
- `git diff --check`: correcto.
- `git check-ignore .env.local`: confirma que el archivo de configuración local está ignorado.
- Dependencias: el dry-run no encuentra paquetes pendientes dentro de los rangos seleccionados. Auditoría repetida con `bun audit --json`: dos avisos, ninguno crítico. El archivo `security-audit.json` conserva el mismo inventario de avisos.

No hay cambios en los archivos de contenido, estilos ni árbol de rutas. Las URLs y los textos de los poemas permanecen iguales. No se ha realizado una nueva revisión visual con capturas: la revisión de código y las comprobaciones SSR verifican esta modificación de infraestructura.

## Advertencias restantes

| Dependencia      | Gravedad y alcance                                                                                                                                                                                                                             | Acción pendiente                                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zod 3.25.76      | Alta. El aviso afecta al consumo de memoria al validar colecciones enormes. El esquema propio actual solo valida dos cadenas de configuración, sin entrada de colecciones de visitantes. No se ha identificado un recorrido explotable actual. | Migración separada y autorizada a una versión corregida de Zod 4 antes de añadir validaciones nuevas de entrada pública; limitar el tamaño de entradas antes de validarlas. No forzar una actualización mayor en esta etapa. |
| minimatch 10.2.6 | Moderada. Transitiva de typescript-eslint, utilizada en desarrollo. Requiere patrones manipulados con determinadas optimizaciones; no recibe entrada de visitantes.                                                                            | Actualización compatible del consumidor cuando incorpore minimatch 11.0.1 o revisión específica. No imponer una versión mayor transitiva.                                                                                    |

Fuentes: https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 y https://github.com/advisories/GHSA-g3hv-75wg-m249.

El lint global preexistente de archivos no modificados mantiene advertencias de formato descritas anteriormente. No bloquea las comprobaciones dirigidas de esta etapa.

## Pasos que realizará la propietaria, después de autorizar la siguiente etapa

1. Abrir el proyecto Supabase `brilla-con-trinity` y confirmar que es el proyecto Free de Frankfurt. Copiar de Connect/API Keys la **Project URL** y la **publishable key** (`sb_publishable_...`). No copiar secret keys, service_role ni contraseñas al chat, al código o a Git.
2. Introducir únicamente esos dos valores en `.env.local`, a partir de `.env.example`, para `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. No modificar todavía las variables de Vercel.
3. En Auth, desactivar los nuevos registros públicos y el acceso anónimo de Auth; mantener email/contraseña como método aprobado. El rol de lectura pública `anon` de Data API no requiere habilitar inicios de sesión anónimos.
4. En URL Configuration, definir Site URL y redirects exactos del entorno de desarrollo acordado. Cuando exista una preview autorizada, añadir su URL exacta. No utilizar comodines amplios ni configurar ahora producción.
5. Mantener Data API activa, exposición automática de nuevas tablas desactivada y RLS automático activo. Tras aplicar el esquema, comprobar exposición de `public`, exclusión de `private`, GRANT y políticas concretas. No habilitar la exposición automática global como solución a permisos.
6. La aplicación del SQL remoto será un paso separado: solo con autorización y mediante una sesión de mantenimiento, conservando su historial de migraciones. No ejecutar los archivos `local-bootstrap.sql` ni fixtures de pruebas en el proyecto remoto.
7. Crear manualmente la identidad de Trinity en Auth mediante un flujo seguro, sin compartir su contraseña. Copiar su UUID para autorizarlo en `admin_users`, también como operación de mantenimiento aprobada. Verificar el flujo de establecimiento/recuperación de contraseña y correo de Auth.
8. Probar Auth y Data API reales con datos sintéticos y los tres perfiles antes de construir el panel y migrar los poemas. El acceso a Vercel privado y cualquier preview/despliegue siguen siendo tareas posteriores.

No hace falta una secret key para las operaciones ordinarias de la aplicación. La conexión local de revisión está preparada, pero la habilitación de funciones nuevas y cualquier despliegue siguen pendientes de autorización y de resolver o mitigar explícitamente los riesgos restantes.
