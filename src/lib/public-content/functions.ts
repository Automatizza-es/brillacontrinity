import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import { createPublicContentClient } from "./client.server";
import { createPublicContentService, PUBLIC_CONTENT_ERROR } from "./service";
import { SESSION_CACHE_HEADERS } from "@/lib/supabase/response-privacy";

async function read<T>(operation: () => Promise<T>) {
  for (const [name, value] of Object.entries(SESSION_CACHE_HEADERS)) setResponseHeader(name, value);
  try {
    return await operation();
  } catch {
    setResponseStatus(503);
    throw new Error(PUBLIC_CONTENT_ERROR);
  }
}
export const loadPublicCatalog = createServerFn({ method: "GET" }).handler(() =>
  read(() => createPublicContentService(createPublicContentClient).catalog()),
);
export const loadPublicPoem = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    if (
      typeof data !== "object" ||
      data === null ||
      !("slug" in data) ||
      typeof data.slug !== "string"
    )
      throw new Error("Solicitud no válida.");
    return { slug: data.slug };
  })
  .handler(({ data }) =>
    read(() => createPublicContentService(createPublicContentClient).poem(data.slug)),
  );
