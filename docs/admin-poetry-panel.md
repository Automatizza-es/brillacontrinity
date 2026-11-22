# Panel privado de poemas

## Alcance y comprobación previa

Rama de trabajo: `prep/phase-1-supabase`. Ruta nueva: `/admin`.

La propietaria confirmó personalmente que la cuenta de Trinity existe en Supabase Auth y que su UUID es el único registrado en public.admin_users. Revocó sus PAT temporales e indicó no crear otros: se continuó con esa confirmación, sin consultar contraseñas ni registrar email o UUID. No se utilizaron tokens globales ni se modificaron usuarios, permisos, tablas, migraciones o configuración remota.

El panel utiliza exclusivamente Project URL y publishable key de la configuración local existente. No se migraron los seis poemas ni se conectaron las páginas públicas a Supabase. El contenido público, su diseño y sus rutas conservan sus archivos originales; el árbol generado solo incorpora /admin.

## Sesiones y permisos

- Inicio de sesión con email/contraseña a través de una función POST del servidor. La contraseña no se devuelve, registra ni persiste en archivos; el campo se vacía al enviar.
- Cookies SSR existentes con Secure en HTTPS y compatibilidad con localhost. Cliente nuevo por petición; no se comparte un cliente autenticado entre usuarios.
- Cada listado, apertura y guardado verifica la identidad con auth.getUser y consulta la pertenencia a admin_users. Si falta autorización o no puede verificarse, no se realiza la operación privilegiada.
- Todas las consultas usan la identidad de la usuaria, sometida a RLS. No hay secret key, service_role, endpoint de altas de usuarios ni escritura en admin_users.
- Cierre de la sesión actual (scope local), seguido de recarga completa para descartar el estado privado del navegador. No afecta a sesiones de la CLI ni a otros proyectos.
- CSRF mediante el middleware existente de TanStack Start. /admin y las funciones de servidor conservan private, no-store y las cabeceras que impiden cachés compartidas. La ruta lleva noindex/nofollow/noarchive.
- Validación en servidor con mensajes fijos y errores de Auth/base de datos traducidos, sin devolver datos crudos del proveedor.

La comprobación de autorización del servidor se repite en cada petición: ocultar botones no sustituye la autorización. Las políticas RLS y la migración se conservan sin cambios.

## Editor

Listado paginado de veinte poemas con filtro de estado. Apertura individual, creación, edición, guardado de borradores, vista previa privada, publicación con confirmación y retirada a borrador con confirmación. No hay eliminación de poemas en esta etapa.

El cuerpo es texto plano: no se recorta, transforma a HTML, divide en párrafos ni reconstruye. La vista previa usa texto escapado y white-space: pre-wrap. Los campos de fecha son opcionales, sin inventar fechas históricas. Se sugiere una dirección a partir del título para poemas nuevos; puede editarse antes de su primera publicación. Después permanece fija, también tras retirar el poema, conforme al trigger existente.

Los guardados usan updated_at como condición de concurrencia para rechazar sobrescrituras de otra pestaña. Los errores de guardado conservan el texto del editor; hay avisos de cambios sin guardar y confirmación antes de descartarlos al cambiar de poema, crear otro, salir o cerrar sesión. No hay guardado automático.

Los colores violetas se limitan a .admin-workspace. Se conservan las tipografías y el estilo editorial; no se cambian tokens ni componentes del sitio público.

Publicar cambia el estado en el gestor y se informa de que la web pública todavía mantiene su contenido actual. No establece un enlace nuevo en las páginas públicas.

## Validación local

- 88 pruebas Vitest: autenticación simulada, denegación administrativa, revalidación por operación, sesiones/cookies existentes, editor, conservación del texto y estrofas, HTML escapado, validación, confirmaciones, errores, concurrencia, navegación y rutas públicas.
- Pruebas RLS en PostgreSQL desechable local: visitantes, usuarios ordinarios, administradores y revocación; permisos de escritura de membresías rechazados, borradores privados, metadatos protegidos y retirada de publicación. Las fixtures se revierten y el contenedor se elimina.
- 44 pruebas Node de los scripts existentes, sin fallos. TypeScript y lint de los archivos modificados.
- Compilación con NITRO_PRESET=vercel, solo local: se genera .vercel/output, ignorado por Git. No se modifica la configuración remota ni se despliega.
- Peticiones HTTP locales: /admin responde con private, no-store y noindex; inicio, poesía y publicaciones siguen respondiendo HTTP 200. Un POST de función de servidor desde un Origin ajeno devuelve 403 antes de autenticarse.
- Revisión del bundle del navegador: sin implementación de signInWithPassword del servidor, referencias a admin_users ni patrones de claves privilegiadas.
- Prueba visual real del editor en un servidor temporal aislado, con almacenamiento exclusivamente en memoria: crear, escribir varias estrofas, previsualizar, guardar, publicar, retirar. Comparación exacta del texto en el DOM. Ese servidor y sus archivos temporales se retiraron después de la prueba; no era una vía de acceso a datos reales.

## Revisión con Trinity

Vista previa local: http://127.0.0.1:8080/admin. El servidor de desarrollo se inicia con `npm run dev -- --host 127.0.0.1 --port 8080`.

La propietaria debe introducir personalmente su email y contraseña en el formulario del panel, sin compartirlos con el agente ni enviar tokens/cookies. Falta esa comprobación real de inicio y cierre de sesión con Trinity: las pruebas automatizadas de Auth utilizan clientes simulados y las de RLS un PostgreSQL local.

Tras iniciar sesión, revisar el listado vacío, abrir Nuevo poema, escribir texto y probar Previsualizar sin guardar. Los botones Guardar/Publicar de /admin utilizan el Supabase real configurado: solo probarlos con contenido real o de prueba cuando la propietaria decida autorizar esa escritura. El agente no los ha utilizado contra Supabase remoto.

Si no se puede confirmar la identidad o pertenencia, el panel no muestra poemas. Si aparece una denegación, revisar la cuenta y su autorización sin ampliar permisos ni usar otra sesión como alternativa automática.

## Documentación oficial consultada

- https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
