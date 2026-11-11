// Run after NITRO_PRESET=vercel npm run build. No network/deployment required.
import handler from "../.vercel/output/functions/__server.func/index.mjs";

for (const path of ["/", "/poesia", "/poesia/atrevete-a-brillar", "/publicaciones", "/contacto"]) {
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
