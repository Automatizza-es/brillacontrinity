# Propuesta de despliegue a Production

Preparación local del 23 de noviembre de 2026. Pendiente de autorización expresa. No se han cambiado configuraciones remotas, fusionado main ni iniciado despliegues en esta etapa.

## Destino y versión

Proyecto Vercel: mjlopezzs-projects/brillacontrinity. Dominio existente: https://brillacontrinity.vercel.app. Rama de trabajo: prep/phase-1-supabase. Production Branch revisada previamente: main. Preview validado sobre 57ab59c; esta corrección cambia únicamente dos mensajes del gestor, amplía una prueba de cookies al dominio real y documenta la entrega.

Antes de actuar, volver a identificar Production y su despliegue activo. Última referencia observada: despliegue F1rEXNQJMBE1tnqju1QNrweatXr9, fuente 85449a1806bdd6d7e68cc844692b54a139ea9987. No asumir que continúa activo si hay cambios de otros colaboradores.

## Variables que se configurarán tras autorización

| Nombre                        | Entorno    | Valor / procedencia                                                                     |
| ----------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| VITE_SUPABASE_URL             | Production | Project URL del proyecto brilla-con-trinity, referencia gwckhuwespupovgweahj, Frankfurt |
| VITE_SUPABASE_PUBLISHABLE_KEY | Production | Publishable key del mismo proyecto, introducida por canal seguro sin imprimirla         |
| NITRO_PRESET                  | Production | vercel                                                                                  |

No usar service_role, secret key, PAT ni contraseña de PostgreSQL. Las variables VITE son públicas por diseño; la autorización depende de Auth y RLS. No registrar valores ni guardar credenciales en Git. Mantener las tres variables de Preview restringidas a prep/phase-1-supabase. Production usa su propio ámbito, sin filtro de rama Preview. Revisar conflictos de nombres existentes sin volcar valores. VERCEL_ENV lo gestiona Vercel y debe ser production; no fijarlo manualmente ni copiar preview.

No cambiar framework, dominios, Root Directory ni overrides de instalación/build/output. Mantener Node 24 declarado en package.json y salida Nitro Vercel verificada localmente. Las variables se incorporan en un despliegue nuevo: no promocionar directamente el artefacto Preview, que fue construido con su propio entorno.

## Autenticación y SEO

El login implementado usa signInWithPassword y vuelve a /admin dentro del mismo origen, sin OAuth, magic links ni callback externo. No necesita añadir Redirect URLs de Supabase para este flujo. La sesión de Preview no se comparte con Production: Trinity iniciará sesión personalmente de nuevo. No es necesario cambiar Site URL para el login actual. Si posteriormente se habilitan correos de recuperación/invitación, habrá que implementar y probar su ruta de retorno antes de configurar Site URL y Redirect URLs exactas; no inventar un callback ni habilitar comodines ahora. Mantener registro público desactivado y la autorización por admin_users/RLS existente.

Cookies host-only, Path=/, SameSite=Lax, Secure en HTTPS (incluido brillacontrinity.vercel.app). Respuestas de sesión, admin y operaciones de servidor: private, no-store y CDN no-store. Las lecturas públicas utilizan cliente anónimo y filtran publicados incluso cuando navega una administradora. La configuración no depende de un hostname Preview fijo.

Production no recibe el X-Robots-Tag global de Preview; /admin conserva noindex, nofollow, noarchive. Los poemas conservan HTML SSR, título, descripción y Open Graph; las rutas inexistentes/retiradas devuelven 404 y noindex, y los fallos de datos no se presentan como biblioteca vacía. pageMeta no genera canonical/og:url ni tiene un dominio Preview fijado. No se añaden nuevos elementos SEO en esta corrección. La protección estándar de Vercel debe conservar Preview privado y permitir el dominio de Production según su configuración vigente; comprobar acceso anónimo al finalizar sin debilitar la protección global.

## Secuencia propuesta (cada escritura requiere la autorización pendiente)

1. Revisar diff final y estado Git. Identificar de nuevo el despliegue Production anterior y conservarlo para reversión.
2. Configurar exclusivamente las tres variables Production anteriores, conservando los demás ámbitos.
3. Integrar la rama revisada en main mediante el flujo Git acordado, sin reescribir historial. El push de main puede iniciar Production automáticamente: tratarlo como operación de despliegue, no como preparación inocua. No hacer antes un despliegue manual redundante.
4. Comprobar que el despliegue nuevo utiliza Production, el commit autorizado, Node 24, Nitro y el dominio existente. No promover el artefacto Preview directamente.
5. Abrir sin sesión de Vercel la página pública; comprobar seis originales, orden, textos, antología y cuatro enlaces, HTML SSR/metadatos, ausencia de noindex global, 404 y móvil.
6. Trinity inicia sesión personalmente en /admin. Verificar autorización, Secure/host-only, no-store y cierre de sesión sin capturar credenciales. Para probar escritura, solicitar/confirmar el alcance de un único poema temporal, publicarlo, comprobar la siguiente solicitud pública, retirarlo y dejarlo privado. No tocar originales, antología ni borradores anteriores.
7. Revisar errores de funciones de forma saneada y confirmar que Preview sigue protegido y no indexable. No declarar probado el dominio Production antes de ejecutar estas comprobaciones reales.

## Reversión

Si hay errores SSR/500, fallos de autenticación, contenido publicado ausente o exposición de borradores, detener las pruebas. Desde Vercel → Deployments, seleccionar el despliegue Production anterior identificado y utilizar Instant Rollback; revisar dominio y destino antes de confirmar. En Hobby solo es elegible el Production inmediatamente anterior; confirmar su elegibilidad antes de desplegar y no eliminarlo. Solicitar autorización para ejecutar la reversión si no está incluida expresamente en la autorización de publicación.

Rollback restaura el artefacto anterior y su configuración incorporada, sin reconstruirlo; no revierte ajustes de variables del proyecto ni datos de Supabase. No ejecutar SQL inverso ni borrar contenido. El Production anterior usa contenido estático, por lo que temporalmente no reflejará nuevas publicaciones del gestor. Si el poema temporal quedó publicado, gestionar únicamente ese registro autorizado, nunca los originales. Tras revertir, verificar páginas y /admin según las capacidades de la versión anterior. Corregir en la rama de trabajo y acordar un nuevo despliegue; no forzar Git ni deshacer historial publicado. Vercel puede suspender la asignación automática de dominios tras rollback: revisar el estado antes de reanudar despliegues.

Documentación oficial consultada:

- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/deployments/promoting-a-deployment
- https://vercel.com/docs/instant-rollback
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/redirect-urls

## Resultado de comprobaciones locales

- Vitest: 8 archivos, 122 pruebas correctas (autorización, editor, rutas públicas, errores, privacidad, SEO y límites Preview/Production).
- TypeScript: `npx tsc --noEmit`, correcto.
- ESLint de los dos archivos TS/TSX modificados: correcto.
- `npm run build:vercel`: correcto con Node 24, sin avisos/error en el registro de esta ejecución.
- `npm run check:preview-build`: Build Output v3, SSR catch-all, runtime nodejs24.x; 97 archivos inspeccionados sin patrones de claves secretas/PAT/clave privada.
- `git diff --check`: correcto. No se modifican rutas, CSS, fuentes de contenido, esquema ni lógica de autenticación.

No se repiten escrituras de prueba ni consultas remotas en esta preparación. La validación real en Production queda pendiente del despliegue autorizado; la validación previa de Preview sigue correspondiendo al artefacto 57ab59c.
