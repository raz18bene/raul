# TechNest Prototyping — SEO review / predare pentru verificare
Data: 21 octombrie 2026

> **Nu publica automat.** Lucrul s-a facut numai in fork-ul `tomaraul12/raul`, branch-ul `seo-google`. Repository-ul original `raz18bene/raul`, branch-ul `main`, si site-ul live nu au fost schimbate.

## Dovezi initiale
Auditul Work din 20–21 octombrie a verificat 511 URL-uri din sitemap (498 produse, 13 alte pagini): 511 au returnat HTTP 200. La inspectia GSC a 9 URL-uri: homepage indexata; 8 URL-uri neindexate cu motivul "Google nu cunoaste adresa URL"; testul live pentru /contact a confirmat blocajul prin robots.txt. Raportul agregat "Indexarea paginilor" era in procesare: **numarul total indexat ramane necunoscut**. Aceste constatari nu demonstreaza ca toate produsele sunt neindexate.

## Modificari pregatite in fork
1. `src/app/robots.ts`: permite explicit /contact, mentinand restrictia /cont.
2. `src/components/shop/ProductsPage.tsx` + `src/lib/catalog-server.ts`: produsele sunt preluate si randate initial pe server pentru categoriile comerciale, cu fallback client pentru erorile de citire din Supabase.
3. `src/components/shop/ProductCard.tsx`: numele produsului are un link HTML real spre pagina lui.
4. `src/app/componente/page.tsx`, `filamente/page.tsx`, `accesorii/page.tsx`: titluri vizibile si texte descriptive utile clientilor, inclusiv context local natural.
5. Metadata pentru Filamente, Accesorii si Printare 3D optimizate; pagina de printare 3D explica procesul ofertarii si evita promisiuni absolute de timp/material/dimensiune.
6. `src/app/layout.tsx`: canonical explicit pe homepage.
7. `src/app/sitemap.ts`: elimina valori `lastmod` ce se schimbau la fiecare generare fara dovada unei schimbari semnificative. Cand baza de date va oferi `updated_at`, se poate reintroduce o data de modificare corecta.
8. `src/app/piese-imprimante-3d/page.tsx`: redirectionare permanenta 308 spre ruta canonica `/accesorii`, care exista deja in navigatie si sitemap. Verifica daca exista legaturi externe importante catre vechea ruta.
9. `src/app/contact/page.tsx` si `src/app/contact/layout.tsx`: text si metadate utile pentru contactul local; `src/app/anpc/layout.tsx`: titlu explicit.
10. `.github/workflows/seo-check.yml` + `scripts/seo-smoke-test.mjs`: teste fara deploy, fara secrete, cu date Supabase simulate.

## Teste executate in GitHub Actions
- `npm ci`: PASS
- `npx tsc --noEmit`: PASS
- `npm run build` (Next.js 15): PASS
- Smoke test HTML fara executarea JavaScript pe /componente, /filamente, /accesorii: fiecare contine un link de produs `<a href="/product/...">`: PASS
- Canonical homepage: PASS
- robots.txt (`/contact` permis, `/cont` blocat): PASS
- Redirect `/piese-imprimante-3d` -> `/accesorii`: PASS

Testele folosesc un server Supabase *simulat*. **Nu** au verificat serviciul Supabase real, functionalitatea filtrelor si cosului intr-un browser, timpul de raspuns al tuturor celor 498 de produse sau succesul deploy-ului Vercel.

## Actiuni ramase — necesare inainte de publicare
- **Teste cu date reale intr-un mediu de preview**, controlat de dezvoltator: fiecare categorie cu numarul corect de produse, filtre, cautare, sortare, butoane "Adauga", cos, checkout, produs individual, pagini mobile si eventuale erori in consola. Verifica HTML-ul initial ca bot fara JS si performanta / payload-ul paginilor de categorie.
- **Corectie in datele Supabase**, nu in cod: produsul **Filament Smart Print PLA+ New Pink 1.75 mm 1 kg**, ID `abee1f8c-8202-4b2a-b8f5-179c1df37181`, are descrierea variantei Brown/maro. Corecteaza `description` si revizuieste toate campurile editoriale asociate prin interfata de administrare, dupa verificarea informatiilor despre produs. Metadata si JSON-LD se genereaza din descriere; nu modifica produsul Brown, ID `b3142f2d-7323-40ea-9aa1-a122d9568023`.
- **Google Search Console**: reviziteaza "Indexare > Pagini" dupa procesare si exporta indexate/neindexate si motive; reinspecteaza /componente, /filamente, /accesorii, /print3d si cateva produse dupa publicare. Nu extrapola din inspectia a 9 URL-uri.
- **Favicon / Apple**: auditul a mentionat 8 raspunsuri 404 pentru resurse Apple/favicon, dar fara lista exacta si confirmare recenta; preia URL-urile afectate din GSC inainte de modificari.
- **SEO local**: verifica programul, adresa si telefoanele firmei, apoi consistenta lor in Google Business Profile si directoare. Auditul Work nu a inspectat direct Google Business Profile.
- **HTTPS HTTP->HTTPS**, Core Web Vitals, actiuni manuale si eventuale probleme de securitate: verificari suplimentare; raportul anterior nu le-a confirmat.
- **Date despre ranking**: GSC colecteaza inca putine afisari. Schimbarile de cod nu garanteaza indexare sau pozitii in Google.

## Procedura de integrare
1. Dezvoltatorul revizuieste diff-ul fork `tomaraul12/raul:seo-google` fata de repository-ul original `raz18bene/raul`.
2. Se creeaza un PR pentru review, se actualizeaza cu modificarile recente din original daca apar si se rezolva conflictele inainte de merge.
3. Preview deployment Vercel cu variabilele de mediu reale, verificat functional si SEO.
4. Numai dupa acceptare, schimbari catre `main` in repository-ul original si publicare controlata.
5. Dupa publicare, verificari live si monitorizare GSC pe parcursul mai multor saptamani.

Aceasta nota reprezinta starea testata in fork, nu dovada ca site-ul public a fost modificat.
