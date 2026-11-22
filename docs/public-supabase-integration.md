# Lectura pública desde Supabase

Rama: prep/phase-1-supabase. Preparación local para revisión, sin despliegue ni modificación de Vercel remoto. No se han escrito datos o cambiado tablas/políticas de Supabase.

## Rutas y diseño

Los loaders de /poesia, /poesia/$slug y /publicaciones usan funciones de servidor de TanStack Start. Las seis URLs originales se conservan; cualquier nuevo slug válido publicado se resuelve por la misma ruta dinámica, sin añadir archivos ni reconstruir la web. Los módulos originales de src/content permanecen en el repositorio y sirven como referencia de validación; el código público solo importa sus tipos, nunca sus valores como respaldo.

Se conservan las clases, tipografías, estilos, textos originales y estructura visual de los estados normales. Se añaden únicamente estados explícitos de ausencia real de contenido y error de conexión. No se toca la presentación administrativa aprobada que ya estaba pendiente en el directorio de trabajo.

Inicio también tenía referencias estáticas a poemas y a la antología. Esas secciones se alimentan ahora de la misma lectura pública para evitar mostrar títulos retirados. El fragmento editorial de Yo soy agua se muestra solo si el poema sigue publicado y el texto actual contiene exactamente el fragmento seleccionado; si se retira o se elimina ese fragmento al editar, deja de aparecer. La composición y el fragmento actuales se conservan.

## Lectura anónima y protección de borradores

Cliente Supabase nuevo por operación, con Project URL y publishable key existentes. No importa cookies de la petición, no utiliza el cliente administrativo, no lee usuarios ni membresías, no conserva sesiones y no usa secret/service_role. Incluso una visitante con sesión administrativa accede al mismo catálogo público anónimo.

Todas las consultas de poemas incluyen status=published, además de las políticas RLS existentes. Se seleccionan columnas explícitas y se valida la respuesta; un registro draft inesperado hace fallar la respuesta completa, en vez de filtrarse accidentalmente en HTML. Los borradores y poemas retirados no se cargan por slug y dan lugar a un 404 normal, sin distinguir públicamente entre ellos y un slug inexistente.

Los poemas se ordenan por sort_order y un desempate estable por id. Las lecturas de colecciones se paginan en bloques de 200 para no truncarse silenciosamente al límite de Data API. Las relaciones editoriales se reconstruyen con los UUID de publicación; las listas de poemas de las publicaciones solo incluyen poemas publicados y mantienen ese mismo orden.

No se recortan ni normalizan títulos, cuerpos o fechas originales. El cuerpo se muestra como texto escapado con la clase poem existente (white-space: pre-wrap). written_on_original conserva su presentación; si solo existe una fecha ISO conocida, se presenta en español usando UTC. No se inventan fechas.

## Actualización y errores

No hay caché de resultados en el servidor ni respaldo estático. Las peticiones a Supabase usan cache=no-store y un timeout de ocho segundos, sin reintentos automáticos del SDK que alarguen una respuesta fallida.

Los loaders fuerzan recarga bloqueante, staleTime/gcTime cero y sin reutilizar preloads. Así una nueva navegación o solicitud consulta el estado actual, sin mostrar un resultado anterior como si fuera fresco. Las respuestas de Inicio, Poesía, detalle y Publicaciones incluyen private, no-store, CDN-Cache-Control y Vercel-CDN-Cache-Control no-store, también en 404 y errores. No se genera HTML estático de esas páginas durante la compilación.

Publicar, editar o retirar se refleja en las siguientes solicitudes. Una página ya abierta sin navegación no recibe actualizaciones en tiempo real; no se han añadido Realtime, sondeos ni cambios a la base de datos.

Una consulta fallida o una respuesta inválida produce un error de carga y HTTP 5xx; nunca una biblioteca vacía, un falso 404 por indisponibilidad ni poemas recuperados del archivo estático. Los mensajes del proveedor no se exponen. Un catálogo vacío que responde correctamente sí muestra su estado vacío explícito. La falta de una relación editorial esperada también se considera error, evitando inventar la etiqueta Inédito.

## HTML, SEO y límites

La primera respuesta incluye HTML SSR completo con texto, título y metadatos SEO, sin depender de JavaScript para consultar los poemas. Se preservan pageMeta y el título/description derivados del poema. Las rutas no existentes o retiradas devuelven 404 con metadatos noindex. El diseño normal no cambia; las respuestas de error tienen un mensaje claro y una acción de reintento.

La configuración local actual se utiliza para la vista previa. Antes de un futuro despliegue habrá que configurar las variables públicas de conexión en el entorno de ejecución que corresponda; esta etapa no lo hace ni cambia la configuración remota. La compilación no consulta Supabase ni incrusta una instantánea de los poemas.

## Evidencia y pruebas

- 111 pruebas Vitest satisfactorias: incluye los seis cuerpos originales, metadatos, enlaces, orden, aislamiento anónimo, paginación, nuevos slugs, publicación/retirada, respuestas inválidas, errores sin respaldo y cabeceras de caché.
- `npm run test:public:http:local`: servidor Vite temporal y API PostgREST simulada, ambos en loopback con claves sintéticas y datos en memoria. Prueba HTML SSR real, SEO, 404, publicación, retirada, republicación, edición, actualización de Inicio/antología, cookies no reenviadas, caída de API y vacío real. No contacta ni modifica Supabase.
- Pruebas RLS existentes en PostgreSQL desechable local: visitantes solo leen publicados; usuarios ordinarios no ven borradores; autorización y revocación administrativas funcionan.
- Comprobación de lectura real mediante la vista previa: Poesía devuelve las seis URLs en orden; Publicaciones incluye cuatro enlaces; las seis páginas individuales responden HTTP 200, con títulos y textos exactamente iguales a las fuentes y metadatos SEO presentes. Una URL inexistente devuelve 404. No se accedió al texto del borrador ni se cambió su estado.
- Compilación local para Vercel satisfactoria. TypeScript, lint y git diff --check forman parte del cierre local.

Las transiciones de publicación/retirada se probaron con datos locales simulados, sin alterar los originales ni el borrador de producción. La comprobación del Supabase real fue exclusivamente de lectura anónima.

## Vista previa y revisión

- http://127.0.0.1:8080/poesia
- http://127.0.0.1:8080/publicaciones
- http://127.0.0.1:8080/poesia/atrevete-a-brillar

El servidor local existente continúa disponible. No se ha desplegado, fusionado main ni cambiado permisos o datos remotos. No es necesario publicar/retirar un poema real para revisar este cambio; las transiciones ya se verificaron de manera aislada.

Referencias oficiales consultadas:

- https://tanstack.com/router/latest/docs/guide/data-loading
- https://tanstack.com/router/latest/docs/api/router/RouteOptionsType
- https://supabase.com/docs/reference/javascript/initializing
