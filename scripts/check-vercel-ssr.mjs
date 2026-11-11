// Run after NITRO_PRESET=vercel npm run build. No network/deployment required.
import handler from "../.vercel/output/functions/__server.func/index.mjs";

for (const path of [
  "/",
  "/poesia",
  "/poesia/atrevete-a-brillar",
  "/poesia/quise-ser",
  "/poesia/circulo-de-mujeres",
  "/poesia/yo-soy-agua",
  "/poesia/me-pierdo",
  "/poesia/desaprendiendo",
  "/publicaciones",
  "/contacto",
]) {
  const response = await handler.fetch(new Request(`http://localhost${path}`), { waitUntil() {} });
  const html = await response.text();
  if (response.status !== 200 || !html.includes('<html lang="es"')) {
    throw new Error(`SSR failed: ${path} (${response.status})`);
  }
  if (path.includes("atrevete") && !html.includes("Hay tanto brillo dentro")) {
    throw new Error("Original poem missing from initial HTML");
  }
  if (path === "/contacto" && !html.includes("mailto:")) {
    throw new Error("Original contact link missing");
  }
  console.log(`${path}: 200, SSR OK`);
}

// Exercise the final server boundary on both successful and error responses.
for (const [path, expectedStatus] of [
  ["/poesia", 200],
  ["/poesia/does-not-exist", 404],
]) {
  const response = await handler.fetch(
    new Request(`https://localhost${path}`, {
      headers: { Cookie: "sb-synthetic-auth-token.0=test-only" },
    }),
    { waitUntil() {} },
  );
  if (response.status !== expectedStatus) throw new Error(`Unexpected status for ${path}`);
  for (const name of ["Cache-Control", "CDN-Cache-Control", "Vercel-CDN-Cache-Control"]) {
    if (!response.headers.get(name)?.includes("no-store")) {
      throw new Error(`Session response missing ${name} on ${path}`);
    }
  }
  console.log(`${path}: ${expectedStatus}, session response cannot be stored in shared caches`);
}
