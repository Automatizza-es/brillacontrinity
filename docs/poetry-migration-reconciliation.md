# Revisión de la aplicación de poetry_foundation

## Evidencia del intento autorizado

El informe local `.supabase-poetry-application.local` registra el destino `brilla-con-trinity`, referencia pública `gwckhuwespupovgweahj`, región `eu-central-1`. El intento empezó el 21 de noviembre de 2026 a las 17:50:58 UTC. La API respondió HTTP 200; el historial devolvió la versión `20261121175059`, nombre `poetry_foundation`, y las sentencias registradas coincidieron con el SQL revisado. No se ha repetido la aplicación ni modificado el historial.

El informe contiene las tres tablas con RLS, siete políticas, permisos efectivos, dos funciones, trigger, restricciones y cero filas. El lector `supabase_read_only_user` tiene BYPASSRLS, por lo que los recuentos cero son concluyentes para ese momento.

## Causa de la alerta

El comprobador esperaba `roles` como un array JavaScript, formato que devuelve el adaptador de PostgreSQL usado en las pruebas locales. La Management API devuelve este campo `name[]` como una cadena PostgreSQL, por ejemplo `{authenticated}`. El comprobador separaba sus caracteres y señalaba incorrectamente POLICIES. El SQL se había aplicado y la verificación del historial ya había pasado antes de esta alerta. El archivo local no llegó a renombrarse porque el proceso se detuvo antes de ese paso.

Se ha corregido la normalización para aceptar exclusivamente los formatos previstos, sin alterar el SQL. La reevaluación del informe original pasa todas las comprobaciones. Las pruebas incluyen el formato real del catálogo remoto, además de un caso que cambia los destinatarios de una política y debe fallar.

## Lecturas verificadas

Una consulta GET nueva a Data API, con la publishable key local y sin mostrarla, confirmó:

- poems y publications: HTTP 200 y listas vacías.
- admin_users: HTTP 401, SQLSTATE 42501 (sin permiso anónimo).
- Accept-Profile private: HTTP 406, PGRST106 (esquema no expuesto).

Para renovar también identidad, historial y catálogo: `npm run reconcile:poetry-migration`, introduciendo el token temporal mediante entrada oculta. El comando solo usa GET de identidad/historial y POST al endpoint de consultas de solo lectura. No contiene una llamada que aplique migraciones, cambie historial ni renombre archivos. Escribe exclusivamente un informe local ignorado por Git: `.supabase-poetry-reconciliation.local`. No usa la sesión global ni guarda credenciales.

La reconciliación del 22 de noviembre de 2026 a las 08:25:35 UTC confirmó el mismo proyecto, versión `20261121175059`, sentencias coincidentes y todas las comprobaciones de estructura/permisos. Resultado VERIFIED_READ_ONLY, sin incidencias y sin escrituras remotas. Se conservan ambos informes originales. El cierre autorizado renombra el archivo local a `supabase/migrations/20261121175059_poetry_foundation.sql`, sin modificar su contenido ni hash, y actualiza las referencias. No se crean usuarios ni contenido.

Validación local de la corrección: 29 pruebas Node satisfactorias y lint de los scripts modificados sin errores. Las pruebas con fixtures remotas siguen sin crear usuarios ni datos: la fixture versionada contiene exclusivamente metadatos del esquema y los recuentos vacíos del informe.

## Cierre local del 22 de noviembre de 2026

El archivo definitivo es `supabase/migrations/20261121175059_poetry_foundation.sql`. Se compararon sus bytes con el SQL del commit anterior: son idénticos. El SHA-256 sigue siendo `3c26003a7e168e2e995f708337fd5bee9d3a95ced3f16cece9a62804de3a418d`. La versión coincide con el informe de reconciliación; no se contactó con Supabase para este cierre.

Comprobaciones satisfactorias tras actualizar las referencias: 44 pruebas Node, 43 pruebas Vitest, pruebas RLS en PostgreSQL local desechable, TypeScript, lint de scripts modificados y git diff --check. El runner local espera disponibilidad TCP para evitar confundir el servidor temporal de inicialización de Docker con el servidor definitivo. No se modificó la web pública ni la configuración de Vercel.

Siguiente etapa propuesta, aún no ejecutada: comprobar que el registro público de Auth permanece desactivado, crear manualmente la identidad de Trinity y autorizar su UUID en public.admin_users mediante una operación administrativa explícita. Crear la identidad no concede por sí solo permisos administrativos. Después se verificarán la pertenencia y los accesos permitidos/restringidos sin publicar contenido. Las credenciales personales no se incluirán en Git ni en el chat.
