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

## Architecture rules
- Service categories live in `src/lib/categories.ts` keyed by stable slugs — URLs (`/buscar?categoria=`) depend on slugs; later migrate to a DB table with the same slugs.
- Site chrome (header/footer) is rendered once in `__root.tsx` — avoids duplication across pages.
- Search state lives in `/buscar` URL params (q, local, categoria) — shareable and SSR-friendly; results will come from the real professionals backend, never fake data.
