> Document istoric. Pentru pachetul actual și instrucțiunile de integrare folosiți [raportul unic din 17 noiembrie](SEO-SECURITY-INTEGRATION-2026-11-17.md). Unele comportamente descrise mai jos au fost înlocuite de corecțiile de securitate.

# TechNest — pachet de integrare SEO și formulare

Data: 15 noiembrie 2026. Branch de predare: `tomaraul12/raul:seo-google`.
Documentul compară integral recomandările tehnice din `Audit_SEO_TechNest_2026-11-14.pdf` cu implementarea existentă și corecțiile acestui pachet. Nu reprezintă o nouă măsurare Search Console.

## Baza integrării

- Branch SEO inițial: `5e701060d46557151c0683cb39f4fa32261de439`.
- Versiunea dezvoltatorului verificată: `raz18bene/raul:main`, `09657011cf9ffc1a7eed6a184b68dd7a06715cb2`.
- Integrarea păstrează istoricul ambelor branch-uri. Îmbinarea locală nu a avut conflicte.
- Sunt păstrate titlul și descrierea actuale pentru Componente, eliminarea fișierelor generate `.next` din Git și regulile `.gitignore` ale dezvoltatorului. Se adaugă ignorarea `*.tsbuildinfo`.
- Nu au fost schimbate versiunile dependențelor existente. Dependențele noi sunt numai pentru teste: `tsx`, `react-test-renderer` și tipurile aferente.
- Nu s-a făcut merge în niciun `main`, deploy, solicitare GSC sau modificare a datelor reale. Testele nu au trimis emailuri, comenzi sau fișiere către servicii reale.

## Comparație cu auditul din 14 noiembrie

| Recomandare | Ce exista în `seo-google` | Ce conține acum pachetul / ce rămâne |
|---|---|---|
| P1/01 — Contact blocat de prefixul `/cont` | Excepția `Allow: /contact` era deja adăugată. | Păstrată; test pentru excepție și sitemap. Paginile de cont/checkout/admin păstrează `noindex`. |
| P1/02 — Produse accesibile din HTML, catalog complet | Cele trei categorii aveau randare pe server și titlurile produselor erau linkuri HTML reale. | Păstrat mecanismul. Citire pe pagini ordonate după ID; continuă și când limita API este sub 1.000. Toate linkurile sunt în HTML-ul inițial. Nu există produse ascunse în spatele unui buton „load more”. O eroare a bazei nu mai devine catalog gol cu HTTP 200. |
| P1/03 — `/piese-imprimante-3d` | Redirect permanent către `/accesorii` era implementat. | Păstrat și testat: 308 → 200. Breadcrumb-ul produselor cu slug vechi indică direct `/accesorii`. |
| P2/04 — Canonical unic și coerent | Pagini/categorii/produse aveau canonical; homepage îl primea din layout-ul global. | Canonical-ul homepage este mutat pe homepage, pentru a nu fi moștenit de pagini inexistente sau private. Teste pentru cele 13 pagini publice, produse, 404 și 5 rute private. URL-urile publice folosesc HTTPS + www; paginile au forma fără slash final. Domeniul efectiv rămâne dependent de configurația Vercel. |
| P2/05 — `lastmod` corect | Datele `lastmod` artificiale fuseseră eliminate. | Păstrat. Sitemap complet, numai produse active, paginare stabilă. La eroare se aruncă excepție, pentru ca revalidarea ISR să păstreze versiunea completă anterioară; nu se publică intenționat o listă parțială. |
| P2/06 — Conținut util, local și metadate distincte | Introduceri și conținut util pentru categorii, Print3D, Contact; texte comerciale exagerate reduse; titluri îmbunătățite. | Păstrate. Titlul/descrierea actuale ale dezvoltatorului pentru Componente sunt intacte. Open Graph și Twitter folosesc acum titlul, descrierea și URL-ul paginii, în loc să moștenească informațiile homepage. |
| P2/07 — New Pink cu descriere Brown | Problema era documentată, dar sursa este în Supabase. | Nu se maschează printr-un text hardcodat în frontend. Este necesară corectarea înregistrării reale după aprobarea proprietarului; procedura și ID-urile sunt mai jos. |
| P2/08 — Shipping / retur în Product JSON-LD | Product/Offer/Breadcrumb existau, fără aceste politici. | Adăugate pentru categoriile standard: transport 20 RON în România; tranzit 1–2 zile conform paginii existente, numai pentru produse în stoc; retur 14 zile cu transport suportat de client și link la excepții. Nu se inventează termen de procesare, ratinguri sau recenzii. Produsele personalizate/categoriile necunoscute nu primesc automat această politică. Validarea comercială și Rich Results Test rămân necesare înainte de publicare. |
| P3/09 — Favicon, lanț HTTP/www, Apple icon | Exista iconul PNG de 48 px generat la `/icon`; `/favicon.ico` lipsea. | Alias permanent `/favicon.ico` → `/icon`, verificat până la imaginea PNG. Lanțul HTTP/www se verifică în Vercel și DNS; nu s-au adăugat redirecturi speculative la nivel de aplicație. Apple touch icon nu este cerut de implementarea actuală; nu blochează acest pachet. |
| Supliment — Formularul afișează succes la eșec | API-ul returna întotdeauna `success:true`; Contact, Print3D și Retur ignorau răspunsul. | API și toate cele trei formulare corectate. Cazurile de eșec, reîncercare, dublu clic și atașament eșuat au teste dedicate. |

Canonical-urile, linkurile și sitemap-ul sunt verificate pe HTML-ul real generat de build, cu date fictive. Rezultatele nu reprezintă confirmarea indexării celor 498 de produse din audit. Indexarea și alegerea canonical-ului de către Google se urmăresc după publicarea aprobată.

## Comportamentul formularelor

- `400` + `success:false` pentru JSON invalid sau nume/email/mesaj invalid. Limite: nume 200, email 254, telefon 50, mesaj 10.000, material 100 caractere; URL de atașament HTTPS de maximum 2.048 caractere.
- `200` + `success:true` numai dacă solicitarea a fost salvată în `contact_requests` **sau** acceptată de Resend. Confirmarea din UI este „înregistrat(ă)”; acceptarea de către provider nu garantează livrarea în inbox.
- `503` + `success:false` dacă niciun canal nu a confirmat. UI păstrează valorile, arată eroarea și permite reîncercarea. Butonul și o gardă internă împiedică două trimiteri simultane.
- Salvarea și emailul sunt încercate independent; fiecare are un timeout de 10 secunde. Un canal secundar eșuat nu transformă o cerere deja înregistrată într-un eșec care invită la duplicare. Erorile operaționale sunt logate fără corpul mesajului, emailul clientului sau IBAN.
- Returul păstrează detaliile comenzii și contului bancar în mesaj, conform formularului existent.
- Print3D oprește trimiterea dacă încărcarea atașamentului eșuează sau fișierul depășește 50 MB. Reîncercarea aceleiași cereri reutilizează atașamentul încărcat deja în sesiunea paginii.
- Conținutul introdus de vizitator este escapat în email; linkurile de atașament nu acceptă scheme executabile. Footerul folosește domeniul public.
- Gardarea dublului clic nu este un sistem global de idempotency: pierderea răspunsului după salvare sau reîncărcarea paginii poate permite o cerere duplicată. Nu se introduce o migrare de bază de date în acest pachet.

## Verificări efectuate

Mediu local: Node 24.22.1, Next 15.5.19. Workflow-ul proiectului folosește Node 22.

| Verificare | Rezultat |
|---|---|
| Instalare din lockfile + instalarea dependențelor de test | Reușită; nicio versiune existentă schimbată. |
| `npx tsc --noEmit` | Reușit. |
| `npm test` | 14 teste reușite: validare, canale de livrare, răspunsuri eronate, stările React ale celor 3 formulare, atașamente, paginare, JSON-LD și politici. |
| `npm run test:seo` | Build de producție reușit + 11 grupe de integrare HTTP reușite, listate mai jos. |
| `git diff --check` | Reușit. |
| `npm run lint` | **Nerulat până la final:** proiectul nu are ESLint configurat; `next lint` deschide configurarea interactivă și iese cu cod 1 în CI. Nu este prezentat ca test trecut. |
| Compatibilitate upstream | Îmbinare fără conflicte cu SHA-ul de mai sus; modificările recente ale dezvoltatorului sunt păstrate. |

Cele 11 grupe de integrare verifică: build; 13 rute publice și redirecturile slash; linkuri HTML pentru 1.005 produse active, inclusiv o categorie cu peste 1.000 de produse; 3 produse individuale și un produs inactiv; 404 reale; 5 rute private; sitemap cu 1.018 URL-uri unice; robots; redirect vechi și favicon; API Contact 400/503/200; HTTP 500 pentru catalog/produs când baza simulată eșuează. API-ul simulat limitează răspunsurile la 137 de rânduri, pentru a detecta paginarea incompletă.

Suita verifică răspunsul serverului fără executarea JavaScript și stările componentelor React în teste. Nu include o probă vizuală în browser pe Vercel, emailuri reale sau drepturile RLS ale bazei reale. Reținerea versiunii anterioare a sitemap-ului după o eroare ISR trebuie confirmată în mediul Vercel; unit testul verifică faptul că paginarea nu returnează rezultate parțiale.

Reproducere, într-un checkout local cu Node 22 sau 24:

```sh
npm ci
npx tsc --noEmit
npm test
npm run test:seo
```

`test:seo` curăță cache-ul de date Next pentru o verificare reproductibilă, pornește API-ul fictiv pe `127.0.0.1:19876`, rulează build-ul și pornește temporar Next pe `127.0.0.1:19877`. Suprascrie configurația Supabase și golește cheia Resend în procesele sale. **Nu publica build-ul rezultat din acest test**: conține configurația fictivă. Pentru un deploy aprobat se face un build nou cu variabilele mediului respectiv.

## Verificări care necesită acces extern / aprobare

### Vercel și domeniu

1. Confirmați `NEXT_PUBLIC_SITE_URL=https://www.technestprototyping.ro` și cheile publice Supabase corecte în mediul viitorului build. Sitemap-ul nu mai ascunde lipsa configurației sau eșecul bazei: acestea pot opri build-ul, ceea ce previne publicarea unui sitemap incomplet.
2. Confirmați cheia privată `SUPABASE_SERVICE_KEY` pe server, `RESEND_API_KEY` și noua variabilă opțională `RESEND_FROM_EMAIL`, de exemplu un expeditor pe un domeniu verificat. Fallback-ul existent `onboarding@resend.dev` este păstrat pentru compatibilitate; recepția reală trebuie verificată în contul Resend.
3. `vercel.json` dezactivează deploy-urile automate Git **pentru `seo-google`**. Celelalte branch-uri păstrează comportamentul existent. Nu mutați pachetul pe alt branch remote și nu faceți merge în `main` înainte de aprobarea publicării. Această regulă nu dezactivează publicări manuale sau integrări externe necunoscute.
4. După aprobarea unui mediu de test separat: verificați HTTPS, domeniul www preferat, lipsa buclelor, păstrarea căilor/query string-urilor și posibilitatea reducerii lanțului `http` → `https` → `www`. Setările de domeniu/DNS nu au fost schimbate.
5. Confirmați protecția/noindex a mediilor preview. Canonical-ul de producție nu înlocuiește această protecție.
6. Confirmați cache-ul sitemap/ISR, răspunsurile 500 la o eroare controlată a catalogului și paginile 404. Refaceți build-ul cu baza de test, apoi cu cea de producție numai la publicarea aprobată.

### Supabase, email și catalog

1. Confirmați că cheia anon poate citi categoriile și produsele active necesare pentru SSR, metadate și sitemap; verificați numărul de produse returnate față de catalogul admin. Nu modificați RLS automat pentru a forța testele să treacă.
2. Confirmați schema și accesul serverului la `contact_requests`: `name`, `email`, `phone`, `material`, `message`, `type`, `file_url`, `status`, `created_at`. Nu este necesară o migrare pentru noul cod.
3. Testați Contact, Print3D și Retur într-un proiect de test: salvare, notificare Resend, mesaje vizibile în admin; simulați separat un canal indisponibil. O probă reală în magazin sau un email real se face numai cu aprobarea proprietarului.
4. Confirmați drepturile de încărcare și citire ale bucket-ului existent `products`, calea `print3d-requests/`, limita de 50 MB și politica de acces la fișiere. Pachetul nu creează bucket-uri și nu schimbă permisiunile sau caracterul public al fișierelor.
5. Confirmați că politicile comerciale publicate sunt valabile: transport 20 RON, tranzit 24–48 ore lucrătoare de la preluare, retur standard 14 zile, excepții pentru bunuri personalizate/filamente utilizate. Dacă există excepții pe produs în categoriile standard, excludeți acele oferte din politica generală înainte de publicare. Nu se atribuie termen de livrare produselor fără stoc.

### Corecția New Pink — pregătită pentru verificare, neexecutată

Produs de corectat: `abee1f8c-8202-4b2a-b8f5-179c1df37181` (New Pink). Produs de comparație, care nu trebuie schimbat: `b3142f2d-7323-40ea-9aa1-a122d9568023` (Brown).

Interogare **numai pentru citire**, de rulat de persoana cu acces:

```sql
select id, name, description, attributes, sku, is_active
from public.products
where id in (
  'abee1f8c-8202-4b2a-b8f5-179c1df37181',
  'b3142f2d-7323-40ea-9aa1-a122d9568023'
);
```

Salvați valorile inițiale, comparați denumirea/culoarea/atributele cu ambalajul sau sursa furnizorului, apoi pregătiți pentru aprobare descrierea New Pink eliminând referințele Brown/maro. Păstrați specificațiile tehnice numai dacă sunt confirmate. Nu faceți înlocuire globală în catalog. După aprobarea și salvarea exclusiv a produsului New Pink, verificați textul vizibil, meta description și JSON-LD pe URL-ul lui; acestea citesc aceeași sursă Supabase. Nu este inclus un `UPDATE` automat cu text neverificat.

### După publicarea aprobată

- Rich Results Test pe produse din cele trei categorii, cu și fără stoc; verificare Product, Offer și Breadcrumb. Confirmați concordanța prețului și stocului între HTML și datele structurate.
- Verificați live `/print3d`, `/componente`, `/accesorii`, `/contact` și câteva produse, apoi procesați solicitările de indexare selectiv, în limita Google. **Nu solicitați din nou automat `/filamente` și nu trimiteți automat cele 500 de URL-uri.**
- Verificați sitemap-ul public și evoluția raportului Page Indexing; erorile istorice de redirect pot persista în raport până la recrawl. Optimizările tehnice nu garantează indexarea.

## Predare și integrare

1. Dezvoltatorul verifică diff-ul față de `raz18bene/raul:main` și matricea de mai sus. Nu trebuie recopiate manual patch-urile SEO vechi: branch-ul le include deja.
2. Se poate verifica local întregul pachet fără push/deploy:

```sh
git fetch https://github.com/tomaraul12/raul.git seo-google
git switch -c review-technest-seo FETCH_HEAD
npm ci
npx tsc --noEmit
npm test
npm run test:seo
```

3. Înaintea integrării aprobate, se verifică dacă `raz18bene/raul:main` a avansat față de `0965701`. Orice commit nou trebuie integrat și retestat; compatibilitatea acestui raport este cu SHA-ul explicit, nu cu modificări viitoare.
4. Numai după aprobarea proprietarului: integrare în `main`, build nou cu configurația corectă, publicare și verificările externe. Codul și corecția de date New Pink au aprobări distincte.

Lista exactă a fișierelor față de upstream este în [SEO-CHANGED-FILES-2026-11-15.md](SEO-CHANGED-FILES-2026-11-15.md). Documentul [SEO-REVIEW-2026-10-21.md](SEO-REVIEW-2026-10-21.md) rămâne evidență istorică; rezultatele actuale sunt cele din acest pachet.

## Referințe tehnice consultate

- [Next.js 15 — moștenirea metadatelor](https://nextjs.org/docs/15/app/api-reference/functions/generate-metadata#merging)
- [Next.js 15 — redirecturi](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/redirects)
- [Vercel — dezactivarea deploy-urilor pe branch](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled)
- [Google — Product/Offer, shipping și retur](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing)
