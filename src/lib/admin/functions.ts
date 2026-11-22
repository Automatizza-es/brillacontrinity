import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminService } from "./service.server";
import { idSchema, listSchema, loginSchema, poemSchema, validate } from "./poems";

// The factory creates no client at import time. Each invocation creates its own
// request-bound cookie client, verifies identity/membership and remains under RLS.
export const loadWorkspace = createServerFn({ method: "GET" })
  .validator((data: unknown) => validate(listSchema, data))
  .handler(({ data }) =>
    createAdminService(getSupabaseServerClient).workspace(data.page, data.status),
  );
export const loginAdmin = createServerFn({ method: "POST" })
  .validator((data: unknown) => validate(loginSchema, data))
  .handler(({ data }) =>
    createAdminService(getSupabaseServerClient).login(data.email, data.password),
  );
export const logoutAdmin = createServerFn({ method: "POST" }).handler(() =>
  createAdminService(getSupabaseServerClient).logout(),
);
export const loadPoem = createServerFn({ method: "GET" })
  .validator((data: unknown) => validate(idSchema, data))
  .handler(({ data }) => createAdminService(getSupabaseServerClient).poem(data.id));
export const savePoem = createServerFn({ method: "POST" })
  .validator((data: unknown) => validate(poemSchema, data))
  .handler(({ data }) => createAdminService(getSupabaseServerClient).save(data));
