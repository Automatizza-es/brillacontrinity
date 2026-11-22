/** Blocking reloads prevent stale published poems appearing after withdrawal. */
export const freshPublicContent = {
  staleTime: 0,
  gcTime: 0,
  preload: false,
  preloadStaleTime: 0,
  preloadGcTime: 0,
  shouldReload: true,
  staleReloadMode: "blocking" as const,
};

export function validPoemSlug(slug: string) {
  return slug.length <= 160 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}
