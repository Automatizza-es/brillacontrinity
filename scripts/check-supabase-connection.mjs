import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { pathToFileURL } from "node:url";
import { parseSupabaseConfig } from "../src/lib/supabase/config.ts";

/** Read-only Auth settings probe. Never returns configuration values or raw errors. */
export async function checkConnection(envText, fetchImpl = globalThis.fetch) {
  let config;
  try {
    const env = parseEnv(envText);
    config = parseSupabaseConfig(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
    const url = new URL(config.url);
    // Only the hosted project origin is accepted; never forward the key elsewhere.
    if (
      !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) ||
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return { code: "CONFIGURATION_REQUIRED" };
    }
  } catch {
    return { code: "CONFIGURATION_REQUIRED" };
  }
  try {
    const response = await fetchImpl(new URL("/auth/v1/settings", config.url), {
      method: "GET",
      headers: { apikey: config.publishableKey, Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 401 || response.status === 403) return { code: "KEY_REJECTED" };
    if (!response.ok) return { code: "PROJECT_UNAVAILABLE" };
    const settings = await response.json();
    if (
      typeof settings?.disable_signup !== "boolean" ||
      typeof settings?.external?.email !== "boolean" ||
      typeof settings?.external?.anonymous_users !== "boolean"
    ) {
      return { code: "UNEXPECTED_RESPONSE" };
    }
    const otherProvidersEnabled = Object.entries(settings.external).some(
      ([name, enabled]) => name !== "email" && enabled === true,
    );
    const authReady =
      settings.disable_signup &&
      settings.external.email &&
      !settings.external.anonymous_users &&
      !otherProvidersEnabled &&
      settings.mailer_autoconfirm === false &&
      settings.saml_enabled !== true &&
      settings.passkeys_enabled !== true;
    return { code: authReady ? "CONNECTED" : "CONNECTED_REVIEW_AUTH" };
  } catch {
    // Fetch errors can include the request URL/headers. Do not print them.
    return { code: "NETWORK_OR_RESPONSE_ERROR" };
  }
}

export function resultMessage(result) {
  const messages = {
    CONFIGURATION_REQUIRED:
      "Configuración pendiente: completa las dos variables de .env.local con Project URL y publishable key válidas. No se ha enviado ninguna petición.",
    KEY_REJECTED:
      "Auth ha rechazado la clave publicable. Revisa que ambos valores pertenezcan al mismo proyecto.",
    PROJECT_UNAVAILABLE:
      "El servicio no está disponible o no ha aceptado la petición. Revisa el estado del proyecto.",
    UNEXPECTED_RESPONSE: "El servicio devolvió una respuesta inesperada. No se muestran sus datos.",
    NETWORK_OR_RESPONSE_ERROR:
      "No se ha podido completar la consulta: revisa la red, la URL y el estado del proyecto. No se muestran detalles sensibles.",
    CONNECTED:
      "Conexión de lectura con Auth correcta. Los ajustes públicos comprobados coinciden con el acceso previsto. No se han consultado tablas ni creado usuarios o sesiones.",
    CONNECTED_REVIEW_AUTH:
      "Conexión de lectura con Auth correcta. Revisa los ajustes de Authentication indicados en la documentación. No se han consultado tablas ni creado usuarios o sesiones.",
  };
  return messages[result.code] ?? "Resultado no disponible.";
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  let result;
  try {
    // Read this project's file directly; never inherit another project's env values.
    const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
    result = await checkConnection(envText);
  } catch {
    result = { code: "CONFIGURATION_REQUIRED" };
  }
  console.log(resultMessage(result));
  process.exitCode =
    result.code === "CONNECTED" ? 0 : result.code === "CONNECTED_REVIEW_AUTH" ? 2 : 1;
}
