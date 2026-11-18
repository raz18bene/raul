> Document istoric. Pentru pachetul actual și instrucțiunile de integrare folosiți [raportul unic din 17 noiembrie](SEO-SECURITY-INTEGRATION-2026-11-17.md). Unele comportamente descrise mai jos au fost înlocuite de corecțiile de securitate.

# Fișierele pachetului TechNest — 15 noiembrie 2026

Comparație față de `raz18bene/raul:main` la `09657011cf9ffc1a7eed6a184b68dd7a06715cb2`. Lista include și lucrările SEO existente în branch, pentru a putea integra întregul pachet o singură dată.

„Păstrat” înseamnă că fișierul era deja diferit de upstream și nu a fost refăcut în această etapă. „Actualizat/nou” identifică fișiere schimbate în etapa curentă.

| Fișier | Stare în această etapă |
|---|---|
| `.github/workflows/seo-check.yml` | Actualizat/nou |
| `.gitignore` | Actualizat/nou |
| `docs/SEO-CHANGED-FILES-2026-11-15.md` | Actualizat/nou |
| `docs/SEO-INTEGRATION-2026-11-15.md` | Actualizat/nou |
| `docs/SEO-REVIEW-2026-10-21.md` | Păstrat |
| `next.config.js` | Actualizat/nou |
| `package-lock.json` | Actualizat/nou |
| `package.json` | Actualizat/nou |
| `scripts/seo-smoke-test.mjs` | Actualizat/nou |
| `src/app/accesorii/layout.tsx` | Actualizat/nou |
| `src/app/accesorii/page.tsx` | Actualizat/nou |
| `src/app/anpc/layout.tsx` | Actualizat/nou |
| `src/app/api/contact/route.ts` | Actualizat/nou |
| `src/app/componente/layout.tsx` | Actualizat/nou |
| `src/app/componente/page.tsx` | Actualizat/nou |
| `src/app/contact/layout.tsx` | Actualizat/nou |
| `src/app/contact/page.tsx` | Actualizat/nou |
| `src/app/despre-noi/layout.tsx` | Actualizat/nou |
| `src/app/despre-noi/page.tsx` | Păstrat |
| `src/app/filamente/layout.tsx` | Actualizat/nou |
| `src/app/filamente/page.tsx` | Actualizat/nou |
| `src/app/page.tsx` | Actualizat/nou |
| `src/app/piese-imprimante-3d/page.tsx` | Păstrat |
| `src/app/politica-confidentialitate/layout.tsx` | Actualizat/nou |
| `src/app/politica-gdpr/layout.tsx` | Actualizat/nou |
| `src/app/politica-livrare/layout.tsx` | Actualizat/nou |
| `src/app/politica-retur/layout.tsx` | Actualizat/nou |
| `src/app/politica-retur/page.tsx` | Actualizat/nou |
| `src/app/print3d/layout.tsx` | Actualizat/nou |
| `src/app/print3d/page.tsx` | Actualizat/nou |
| `src/app/product/[id]/page.tsx` | Actualizat/nou |
| `src/app/robots.ts` | Păstrat |
| `src/app/sitemap.ts` | Actualizat/nou |
| `src/app/termeni-conditii/layout.tsx` | Actualizat/nou |
| `src/components/shop/ProductCard.tsx` | Păstrat |
| `src/components/shop/ProductsPage.tsx` | Actualizat/nou |
| `src/hooks/useContactSubmission.ts` | Actualizat/nou |
| `src/lib/catalog-pagination.ts` | Actualizat/nou |
| `src/lib/catalog-server.ts` | Actualizat/nou |
| `src/lib/contact.ts` | Actualizat/nou |
| `src/lib/seo.ts` | Actualizat/nou |
| `tests/contact.test.tsx` | Actualizat/nou |
| `tests/seo.test.ts` | Actualizat/nou |
| `tsconfig.json` | Actualizat/nou |
| `tsconfig.test.json` | Actualizat/nou |
| `vercel.json` | Actualizat/nou |

Total: **46 fișiere** în diferența finală față de upstream.

Față de vechiul `seo-google`, sunt preluate și ștergerile celor 27 de fișiere `.next` din commiturile dezvoltatorului. Ele nu apar ca ștergeri față de `upstream/main`, deoarece sunt deja eliminate acolo. Layout-ul global nu diferă în final de upstream: canonical-ul homepage este definit în `src/app/page.tsx`.

Codul pentru comenzi, Stripe/Netopia, SameDay, Oblio, prețuri, stocuri, admin și schemele bazei de date nu a fost modificat. Fișierul `next-env.d.ts` generat local nu face parte din pachet.
