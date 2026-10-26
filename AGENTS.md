<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Editable site content (poems, publications) lives in `src/content/*.ts` as typed data; pages render from it so texts can be added without touching layout.
- Shared shell (header/footer) is in `__root.tsx`; per-page SEO via `pageMeta()` in `src/lib/seo.ts`.
- Missing real content is shown with the `Pending` component, never invented filler.
