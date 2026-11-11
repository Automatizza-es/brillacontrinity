# Conexión local de desarrollo — Supabase Free Frankfurt

## Estado de esta etapa

Se ha comprobado `prep/phase-1-supabase`: el directorio estaba limpio al comenzar. Se ha creado `.env.local` únicamente porque no existía, con los valores de ejemplo de `.env.example` y permisos 0600. La creación utiliza una operación exclusiva: si el archivo ya existe, no lo lee ni lo sobrescribe. `.env.local` está ignorado y no está versionado.

No se han añadido credenciales reales, conectado el proyecto remoto, creado usuarios o tablas, aplicado migraciones remotas, modificado Vercel ni alterado páginas, rutas o diseño.

## Introducir personalmente los dos valores

Abrir `.env.local` en un editor de texto y sustituir solamente los valores a la derecha de `=`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
```

En Supabase, seleccionar `brilla-con-trinity` (Free, Frankfurt) y abrir Connect/API Keys para obtener Project URL y la **publishable key**, que comienza por `sb_publishable_`. La URL debe ser la raíz HTTPS del proyecto, no la URL del dashboard, una cadena de conexión PostgreSQL ni una ruta REST.

No enviar los valores por chat ni escribirlos en comandos, documentos versionados, capturas o commits. No usar `sb_secret_`, `service_role`, la contraseña de la base de datos o un token personal. La aplicación ordinaria no necesita esos secretos. Los dos valores `VITE_*` son públicos para el cliente web; los permisos reales dependerán de RLS y de la sesión.

Guardar como texto plano y reiniciar el servidor de desarrollo si estaba abierto. Git ignora tanto `.env.local` como las otras variantes `.env.*`, salvo el ejemplo.

## Puerto y URLs realmente utilizados

Se ha resuelto la configuración efectiva de Vite: puerto predeterminado **8080**, `strictPort=false` fuera del sandbox y host predeterminado `::`. No se presupone el puerto 3000 de los ejemplos genéricos de Supabase.

Para desarrollo local reproducible, arrancar desde la carpeta del proyecto con:

```sh
npm run dev -- --host localhost --port 8080 --strictPort
```

Abrir `http://localhost:8080/`. Esto evita exponer el servidor en la red local y evita que Vite cambie silenciosamente a 8081 si 8080 está ocupado. Si el puerto está ocupado, resolver ese conflicto antes de iniciar el servidor; no añadir redirecciones para puertos arbitrarios.

En **Authentication → URL Configuration** del proyecto dedicado a esta etapa:

- **Site URL:** `http://localhost:8080/`.
- **Redirect URLs adicionales:** ninguna por ahora; dejar la lista vacía si no hay otros usos autorizados de ese proyecto.

La comprobación de conexión solo hace una petición HTTP de lectura: no necesita Site URL ni redirects para funcionar. Configuramos Site URL como origen local previsto y valor por defecto para futuros enlaces de Auth. No se ha implementado OAuth, confirmación, recuperación de contraseña ni un callback de autenticación. No añadir `/auth/callback`, `/admin`, comodines, Vercel ni el dominio futuro como si esas rutas ya existieran. El futuro inicio con email/contraseña tampoco necesita por sí mismo un callback de OAuth. Cuando se implemente un flujo de correo/recuperación se acordará su ruta exacta y se añadirá entonces si es necesaria.

No alternar entre localhost y 127.0.0.1: son orígenes distintos y sus cookies no se comparten. La URL de Supabase sigue siendo la URL HTTPS remota; no sustituirla por localhost.

## Authentication: usuarios creados manualmente

En Authentication, configurar las opciones por su nombre; las secciones del dashboard pueden mostrarse como Sign In / Providers o configuración general:

| Opción                             | Valor                           |
| ---------------------------------- | ------------------------------- |
| Allow new users to sign up         | Desactivado                     |
| Allow anonymous sign-ins           | Desactivado                     |
| Allow manual linking               | Desactivado                     |
| Email provider / Email sign-in     | Activado                        |
| Confirm email                      | Activado                        |
| Phone y proveedores sociales/OAuth | Desactivados                    |
| SAML/SSO y passkeys, si aparecen   | No habilitarlos para este flujo |

“Allow manual linking” permite vincular identidades; **no** habilita ni controla la creación manual de usuarios por la propietaria. Puede permanecer desactivado.

No crear usuarios todavía. En la etapa posterior autorizada, se creará manualmente la identidad de Trinity y se verificará su email mediante un flujo seguro. Después se autorizará su UUID en `admin_users`, una vez aplicada su migración. Crear una identidad en Auth por sí solo no otorga permisos administrativos. Desactivar registros tampoco elimina usuarios existentes: cuando corresponda, habrá que revisar el inventario existente.

El acceso anónimo de Auth es distinto del rol `anon` de lectura pública de Data API: no hay que habilitar sesiones anónimas para leer futuros poemas publicados.

Mantener Data API activa, exposición automática desactivada y RLS automático activo. No habilitar de forma global la exposición de tablas para esta prueba.

## Prueba preparada: lectura de ajustes públicos de Auth

```sh
npm run check:supabase
```

El script lee `.env.local` directamente, sin depender de variables heredadas de otro proyecto. Valida los dos campos con el validador existente y limita el destino a la raíz HTTPS de un proyecto alojado en `*.supabase.co`. No sigue redirecciones, usa un timeout de diez segundos y envía la clave publicable en la cabecera `apikey`, nunca en la URL.

Hace **una petición GET a `/auth/v1/settings`**. No consulta tablas, no inicia sesión, no crea usuarios ni sesiones y no ejecuta SQL. No imprime la URL, la clave, cabeceras, cuerpo recibido ni detalles de errores. Solo comunica un resultado fijo.

Resultados:

- Código de salida **0**: Auth responde y los ajustes públicos comprobados concuerdan con la configuración prevista.
- Código **2**: la conexión de lectura funciona, pero hay ajustes de Authentication que revisar.
- Código **1**: faltan valores, la clave fue rechazada, la red falla o la respuesta no es válida; el mensaje no incluye datos sensibles.

Con los ejemplos actuales se ha comprobado que se detiene antes de enviar ninguna petición. No se ha probado una conexión real. El resultado futuro no certifica región, políticas RLS, acceso Data API, correos, sesiones SSR ni permisos administrativos; esos pasos se validarán más adelante con autorización. “Allow manual linking” y las URLs no se verifican mediante esta respuesta pública: revisarlas personalmente en el dashboard.

## Archivos y validación

- `package.json`: comandos `check:supabase` y `test:connection`.
- `scripts/check-supabase-connection.mjs`: comprobación sin tablas ni autenticación de usuario.
- `scripts/check-supabase-connection.test.mjs`: pruebas sin red con valores ficticios.
- Este documento. `.env.local` queda solo en el equipo, fuera de Git.

Se utiliza Node 24, ya disponible en el entorno, con su soporte nativo para importar el validador TypeScript existente; no se añade ninguna dependencia ni se cambia el lockfile.

Verificaciones: 14 pruebas del script correctas; suite Vitest existente correcta; TypeScript y ESLint de los archivos nuevos correctos; `git diff --check` correcto; configuración efectiva de Vite verificada; `.env.local` ignorado y no versionado. La ejecución con placeholders devuelve código 1 de configuración pendiente sin tráfico de red.

Referencias oficiales:

- https://supabase.com/docs/guides/auth/general-configuration
- https://supabase.com/docs/guides/auth/redirect-urls
- https://github.com/supabase/auth/blob/master/internal/api/settings.go
