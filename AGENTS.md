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
- Professional storefront lives in `professionals` + `portfolio_items`; private contact data in `profiles`; roles only in `user_roles` (has_role) — prevents privilege escalation and keeps phone/email off public reads.
- Platform-controlled columns (is_verified, ratings, services_count) are locked by a DB trigger for end users — future stages update them server-side only.
- Media is in the private `professional-media` bucket under `{userId}/...`; pages show signed URLs generated server-side — workspace blocks public buckets.
- All professional reads/writes go through `src/lib/professionals.functions.ts` (zod-validated server functions); shared rules (completeness, publish requirements, options) live in `src/lib/professional.ts`.
- Profile wizard is `/painel/perfil?passo=N`; review step renders the same `ProfessionalProfileView` as the public `/profissional/$slug` page — preview must match public page.
- Marketplace flow tables: `service_requests` → `quotes` → `jobs` → `reviews`; `verification_requests` per professional. Job fees, profile rating/service counts and is_verified are set only by DB triggers — clients never write money or reputation fields.
- Platform commission is computed in the `compute_job_fees` trigger; `src/lib/commission.ts` mirrors it for display only — change both together.
- Verification documents live in the private `verification-docs` bucket (owner-only) — never in the profile media bucket, which is readable for public pages.
- Dashboard data comes from one `getDashboard` server fn (`src/lib/dashboard.functions.ts`); `/painel` layout holds the section nav.
- Opportunity eligibility is enforced by `matches_opportunity` in database policies and quote submission; dashboard totals are aggregated by `dashboard_totals` independently of recent-item lists, preventing truncation and bypasses.
- Job owners may register manual jobs and change lifecycle status only; the fee trigger preserves identity, amounts and payout fields and validates transitions to prevent forged earnings.
- Private content routes use `pageHead` for consistent per-page metadata without revealing account data.
