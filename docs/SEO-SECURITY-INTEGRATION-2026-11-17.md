# TechNest — raport unic de integrare SEO, securitate și formulare

Data verificării: **17 noiembrie 2026**. Pachet: [`tomaraul12/raul:seo-google`](https://github.com/tomaraul12/raul/tree/seo-google).

Acesta este documentul de predare actual și înlocuiește instrucțiunile de integrare din raportul din 15 noiembrie. Branch-ul include corecțiile SEO anterioare, modificările dezvoltatorului și remedierea problemelor suplimentare confirmate în cod. **Este pregătit pentru evaluare și testare într-un mediu separat; publicarea depinde de migrarea Supabase, configurarea serviciilor și verificările de mai jos.**

Nu s-a făcut merge în `main`, deploy, modificare de configurație de producție, migrare pe baza reală, plată, emitere de document fiscal, trimitere de email sau modificare de produs real. Nicio solicitare nouă de indexare GSC nu a fost făcută.

## 1. Baza și compatibilitatea

- Pachetul SEO verificat inițial: `20333edf4b0ca6e4906ca30cfda8e6b8b9c65cf0`.
- Upstream verificat din nou: `raz18bene/raul:main` = `09657011cf9ffc1a7eed6a184b68dd7a06715cb2`. Acest commit este strămoș al branch-ului; istoricul dezvoltatorului este păstrat.
- `tomaraul12/raul:main` rămâne `681f5451150c69b47a13c6249a2eec6bd1f2fdfb`.
- Sunt păstrate metadatele dezvoltatorului pentru Componente, eliminarea `.next` din Git, facturarea PF/PJ, Easybox, conturile, panoul admin și corecțiile SEO existente. Schimbările de comportament necesare securității sunt descrise explicit mai jos.
- Nu s-au actualizat versiunile dependențelor existente. S-au adăugat `jose` pentru verificarea criptografică Netopia și `@electric-sql/pglite` numai pentru teste PostgreSQL locale; lockfile-ul este inclus.
- `vercel.json` păstrează `git.deploymentEnabled.seo-google=false`. Aceasta blochează integrarea Git Vercel pentru acest branch, nu publicările manuale sau alte integrări necunoscute.

## 2. Rezultatul celor zece verificări suplimentare

| Punct | Problemă confirmată | Corecție inclusă | Limită rămasă |
|---|---|---|---|
| 1. Produse | POST/PUT/DELETE foloseau service role fără autentificare. | Verificarea sesiunii la Supabase și a rolului `app_metadata.role=admin` înaintea modificării; câmpuri permise și validare ID/preț/stoc. GET public folosește cheia anon. | Politicile bazei reale trebuie verificate și aplicată migrarea RLS; adminul folosește și Supabase direct. |
| 2. Oblio | Sync și scăderea stocului erau publice; prețurile și cantitățile veneau din browser. | Toate operațiile și diagnosticul cer admin; sync numai POST. Aviz/factură din comanda salvată, SKU din catalog, sumă verificată, blocare comenzi anulate și facturi card neplătite. Jurnal unic de operații și cheie de idempotency la furnizor. | Gestiunea, seriile, fluxul de stoc și emiterea efectivă trebuie probate separat. |
| 3. Comenzi și Stripe | Totalul, liniile și cantitățile puteau fi manipulate; inserarea liniilor putea eșua fără anularea comenzii. | RPC tranzacțional citește prețul real, reducerea, stocul și starea activă; validează cantități, transport și total. Comanda și liniile se salvează împreună. Stripe folosește exclusiv comanda salvată, cu token secret al checkout-ului sau proprietarul autentificat. | Necesită migrarea 001; comenzile istorice nu primesc automat încredere. Nu există încă rezervare de inventar. |
| 4. Confirmări de plată | Netopia accepta JSON nesemnat; statusul 5 era tratat greșit. Stripe nu compara complet sesiunea cu comanda. | Netopia verifică RS512, cheia de încredere, emitentul, POS-ul, expirarea și hash-ul corpului original; verifică tranzacția/suma/moneda/comanda. Stripe verifică semnătura, recitește sesiunea și verifică exact legătura cu comanda, mediul test/live, suma și moneda. Numai o plată confirmată poate marca o comandă plătită. | Inițierea Netopia veche este închisă cu 503; checkout-ul site-ului folosește Stripe. Nu este livrat un flux Netopia v2 complet și verificat cu furnizorul. |
| 5. Teste automate | Nu existau regresii suficiente pentru aceste vulnerabilități. | Teste pentru API, semnături, sume, identitate, idempotency, RLS și tranzacții PostgreSQL; regresiile SEO și formulare sunt păstrate. | Simulările nu înlocuiesc verificarea configurației și a schemei reale. |
| 6. TVA | Avizul de stoc avea 19%; o variabilă veche putea menține cota incorectă. | Funcție comună: 21%, prețuri brute cu TVA inclus. Configurația explicită veche de 19% este respinsă vizibil. | Contabilul confirmă regimul firmei, cotele din Oblio și tratamentul documentelor istorice. Nu s-au recalculat prețuri sau facturi reale. |
| 7. IBAN și date | Formularul afirma că IBAN-ul nu se stochează, deși intra în mesajul bazei și email. Adresa se păstra automat în browser. | Eliminată solicitarea IBAN/bancă din declarație, corectate informările; adresa locală devine opțională, expiră la 30 de zile și poate fi eliminată prin debifare. Tokenurile și notele nu se păstrează în această copie. | IBAN-urile istorice, emailurile, termenele de retenție, contractele cu furnizorii și transferurile necesită inventariere/aprobare. |
| 8. Retragere/retur | Condiții prea restrictive privind ambalajul/filamentele; termen/metodă de rambursare inexacte; lipsea funcția online cerută în 2026. | Link permanent, formular fără cont/motiv/IBAN, revizuire și confirmare explicită, înregistrare atomică, dovadă cu conținut/data/ora, email și copie TXT. Politica este actualizată; linkurile SOL/ODR închise sunt înlocuite. | Confirmarea reală prin email și procesul de tratare promptă a emailurilor restante trebuie verificate înainte de publicare. Validarea textului juridic și a practicii comerciale rămâne la operator. |
| 9. Print3D | Fișiere în bucket-ul public `products`, cu URL public transmis/stocat. | Bucket privat separat, upload semnat, dovadă HMAC pentru asociere, download de 60 secunde numai pentru admin. Fără link public în email. Cererea cu atașament necesită salvarea referinței în baza de date. | Fișierele vechi publice NU sunt revocate de această schimbare; necesită migrare aprobată. |
| 10. Homepage | Titlul prioritiza magazinul de produse, nu printarea locală. | `Printare 3D Timișoara, filamente și Arduino | TechNest`, consecvent cu Open Graph și Twitter; descriere actualizată. | Rezultatul în Google se verifică după publicarea aprobată și recrawl. |

Au fost corectate și două probleme conexe: interfața admin/cont nu mai acceptă rolul autoeditabil din `user_metadata`, iar pagina de revenire de la plată nu mai afirmă succes doar pe baza URL-ului. Diagnosticul SameDay necesită admin și nu mai întoarce fragment din token.

## 3. SEO anterior — verificat și păstrat

| Recomandare din auditul din 14 noiembrie | Stare în pachetul final |
|---|---|
| P1/01: `/contact` afectat de prefixul `/cont` din robots | Excepția `Allow: /contact` păstrată; rutele private rămân `noindex`. |
| P1/02: linkuri HTML și catalog complet | Randare pe server în cele trei categorii, ancore reale spre produse, paginare ordonată stabil după ID. Erorile bazei nu sunt prezentate drept catalog gol cu HTTP 200. |
| P1/03: vechea categorie | 308 de la `/piese-imprimante-3d` la `/accesorii`; breadcrumb direct spre destinația canonică. |
| P2/04: canonical | Canonical propriu pentru pagini și produse; homepage nu mai este moștenit pe pagini private/inexistente. HTTPS + www, fără slash final. Configurația domeniului Vercel rămâne de verificat. |
| P2/05: sitemap și lastmod | Toate produsele active, paginare completă, fără date `lastmod` inventate. Eroarea nu produce intenționat un sitemap parțial. |
| P2/06: conținut local/metadate | Textele utile și metadatele distincte se păstrează, inclusiv cele ale dezvoltatorului pentru Componente. Se schimbă suplimentar titlul homepage. |
| P2/07: New Pink descris drept Brown | Corecția de date rămâne neexecutată: produs `abee1f8c-8202-4b2a-b8f5-179c1df37181`; comparație Brown `b3142f2d-7323-40ea-9aa1-a122d9568023`. Verificare și aprobare separată, fără înlocuire globală în catalog. |
| P2/08: date structurate comerciale | Product/Offer/Breadcrumb, transport 20 RON în România și retur 14 zile pentru categoriile standard. Nu se inventează ratinguri, procesare sau restocare; descrierea returului este aliniată noii politici. |
| P3/09: favicon și redirecturi | Alias `/favicon.ico` către icon păstrat. Lanțul HTTP/HTTPS/www și cache-ul ISR necesită acces Vercel/DNS; nu au fost schimbate speculativ. |
| Formular Contact cu succes fals | Succes numai după salvare sau acceptarea emailului; eșecurile păstrează formularul. Print3D cu atașament privat cere și salvarea referinței. Retragerea folosește noul flux separat. |

Nu s-a reevaluat numărul actual de pagini indexate în GSC. Verificarea locală utilizează produse fictive, nu dovedește indexarea catalogului real. După publicare se verifică selectiv `/print3d`, `/componente`, `/accesorii`, `/contact` și câteva produse. **Nu se retrimite automat `/filamente` și nu se solicită indexarea în masă a celor aproximativ 500 de URL-uri.**

## 4. Comportamente care trebuie cunoscute la integrare

### Comenzi, plăți și stoc

Prețul salvat este `sale_price` dacă există, altfel `price`, preluat din catalog în tranzacție. Cantitățile trebuie să fie întregi 1–999, produsele distincte și active; stocul curent trebuie să acopere fiecare linie. Transportul este 20 RON pentru SameDay/Easybox și 0 pentru ridicare. Un total transmis diferit de cel calculat produce 409; numele/prețurile transmise în coș nu sunt autoritate.

Tokenul de checkout are 32 octeți aleatori; baza privată păstrează numai hash-ul. Sesiunea de plată este asociată unei singure comenzi și unui singur furnizor. Evenimentele duplicate sunt idempotente, o notificare de eșec întârziată nu retrogradează o comandă plătită, iar erorile de bază întorc 503 pentru reîncercarea furnizorului. Sesiunile expirate/ambigue și comenzile vechi cer reconciliere, nu o nouă debitare automată. Rambursările/chargeback-urile nu sunt automatizate în acest pachet.

**Stocul este validat, dar nu rezervat.** Mai multe comenzi încă neprocesate pot concura pentru același stoc. Apelul public automat care scădea stocul chiar la crearea unei comenzi neplătite a fost eliminat. Fluxul implicit pregătit descarcă stocul prin factura emisă de administrator (`useStock=1`); avizul separat este refuzat. `OBLIO_STOCK_DOCUMENT=notice` selectează alternativ avizul admin și facturează fără a mai descărca stocul. Nu schimbați această alegere pe comenzi deschise fără reconciliere. Seria, gestiunea și sincronizarea trebuie confirmate cu persoana care gestionează Oblio. Pentru garanție contra supravânzării este necesară o etapă separată de rezervare/expirare a inventarului, coordonată cu Oblio.

Operațiile Oblio în stare `pending` nu se retrimit automat după un rezultat incert; se verifică în contul furnizorului și se reconciliază jurnalul. Sync raportează erorile parțiale și citește toate paginile Supabase. Potrivirea existentă prin SKU/nume este păstrată; unicitatea SKU și numele ambigue trebuie verificate pe catalogul real.

### Print3D și date istorice

Upload-ul se face direct în Storage prin token semnat, pentru a evita limita corpului funcțiilor Vercel; limita server/bucket este 50 MB. Referința este de forma `private:<cale>`. O cerere cu atașament nu afișează succes dacă referința nu s-a salvat. Descărcarea cere un administrator verificat pe server.

Migrarea propusă nu face bucket-ul `products` privat, deoarece ar afecta imaginile produselor. RLS nu anulează URL-urile publice existente. Operația separată, după aprobare: inventarierea numai a prefixului `products/print3d-requests/`, copierea în bucket-ul privat, verificarea copiilor, actualizarea referințelor și eliminarea originalelor publice. Referințele vechi sunt semnalate în admin, nu deschise automat. Nu s-a șters sau mutat niciun fișier real.

### Retragere și informări

OUG 34/2014, art. 11¹, introdus prin OUG 18/2026 și aplicabil de la 19 iunie 2026, prevede funcția online și confirmarea pe suport durabil. Formularul oferă revizuire, confirmare explicită, identificarea contractului și email; nu condiționează înregistrarea de justificare, IBAN sau autentificare. Dovada include declarația și momentul înregistrării în UTC. Același identificator de reîncercare păstrează dovada și nu dublează înregistrarea.

Dacă Resend eșuează, declarația rămâne înregistrată, UI arată emailul în așteptare și permite descărcarea dovezii. Adminul are „Retrimite confirmări retragere”, cu loturi de 25. **Nu există un cron de recuperare configurat**; trebuie asigurate monitorizarea și retransmiterea promptă. Acceptarea la Resend nu garantează livrarea în inbox. Înainte de publicare trebuie verificat acest proces, inclusiv emailuri respinse și indisponibilitatea furnizorului.

Politica de retur corectează termenul rambursării raportat la notificare, metoda de plată inițială, costul livrării standard, posibilitatea legală de a aștepta bunul/dovada expedierii și diminuarea justificată a valorii. Ambalajul lipsă/deschiderea filamentului nu exclud automat retragerea; excepția bunurilor personalizate și condițiile serviciilor rămân distincte.

Textele de confidențialitate descriu traseul efectiv al datelor și elimină promisiunea falsă despre IBAN. Nu certifică singure conformitatea GDPR: operatorul trebuie să completeze/verifice termenele concrete de păstrare, locațiile proiectelor, contractele de prelucrare, garanțiile transferurilor și gestionarea datelor istorice. Nu sunt inventate perioade legale sau regiuni de găzduire.

## 5. Verificări efectuate și reproducere

Verificările de mai jos au fost executate pe pachetul recuperat și finalizat. Dovezi: [teste automate](verification/unit-tests.txt) și [build + verificări HTTP](verification/production-checks.txt).

| Verificare | Rezultat |
|---|---|
| TypeScript `npx tsc --noEmit` | Trecut pe versiunea recuperată, Node 24.22.1. |
| `npm test` | 40 teste trecute, fără servicii reale; include subtestele PostgreSQL. |
| Build + `npm run test:seo` | Trecut: build de producție și toate cele 12 grupe HTTP, numai cu date fictive. |
| `git diff --check` | Trecut. |
| Compatibilitate upstream | `0965701` inclus în istoric; refetch fără modificări noi. |
| Lint | Proiectul nu are ESLint configurat; `next lint` ar solicita configurare. Nu este raportat ca test trecut. |
| Audit complet al dependențelor | Nu este acoperit de aceste teste; nu se afirmă absența tuturor CVE-urilor. |

Testele includ SQL executat într-un PostgreSQL local PGlite, cu politici vechi intenționat prea permisive: tranzacții și rollback, refuzul plăților neconcordante, protecția datelor de comandă, diferența `user_metadata`/`app_metadata`, bucket privat fără ascunderea imaginilor publice și retrageri idempotente. Handler-ele reale sunt apelate cu baze/procesoare simulate: semnături Stripe invalide, sesiuni neplătite, total fals, eroare de bază și emitere Oblio fără duplicare. Netopia are teste criptografice cu chei generate local.

Testul de producție construiește și pornește Next.js numai cu Supabase fictiv: 1.005 produse active, răspunsuri limitate la 137 rânduri, 13 pagini publice, produse active/inactive, 404, 5 rute private, 1.018 URL-uri în sitemap, robots, redirecturi, formulare și rute API protejate. Verifică HTML-ul inițial, nu doar funcții izolate. Nu include verificare vizuală în browser, RLS/Storage reale, livrare reală de email sau plată sandbox/live.

```sh
npm ci
npx tsc --noEmit
npm test
npm run test:seo
```

`test:seo` folosește porturile locale 19876/19877 și curăță cache-ul de date Next. **Nu publicați build-ul generat de test**: include configurarea fictivă. Un deploy aprobat necesită build nou cu mediul corect. Workflow-ul [GitHub Actions](https://github.com/tomaraul12/raul/actions/workflows/seo-check.yml) reproduce verificările pe Node 22.

## 6. Ce necesită acces Vercel/Supabase și aprobare

| Sistem / responsabil | Verificare sau acțiune necesară înainte de publicare |
|---|---|
| Supabase — dezvoltator | Export de schemă/politici, backup și probă pe proiect separat cu aceeași schemă, enum-uri și trigger-e. Verificați și politicile `profiles`, grant-urile, citirea publică a catalogului și politicile Storage existente. Fixture-ul local nu este o copie a schemei reale. |
| Supabase — dezvoltator | După aprobare, migrațiile 001 → 002 → 003 → 004 din `supabase/migrations/`. Nu au fost aplicate remote. Fără ele, noile comenzi/retrageri/upload-uri pot refuza operația în siguranță; nu publicați codul singur. |
| Admin Supabase | Rolurile administrative trebuie să fie în `app_metadata`, setate printr-o cale administrativă sigură. Verificați un admin real și un client obișnuit; reîmprospătați sesiunile după schimbarea rolurilor. |
| Vercel | Verificați `SUPABASE_SERVICE_KEY` exclusiv server, URL/anon key corecte, `NEXT_PUBLIC_SITE_URL=https://www.technestprototyping.ro`, domeniile/redirecturile HTTPS/www, cache ISR și protecția preview. |
| Print3D | Bucket privat `print3d-requests`, limită 52.428.800 bytes; secret nou `PRINT3D_UPLOAD_SECRET`, aleator și de minimum 32 caractere, numai pe server. Testați upload semnat, acces public refuzat, download admin și expirarea linkului. Migrați separat fișierele vechi după aprobare. |
| Stripe | Cheie și webhook secret din același mediu, endpoint-ul corect, evenimentele Checkout relevante. În sandbox autorizat: plată reușită, refuzată, întârziată, duplicată, sumă/sesiune greșită și reîncercare după eroare DB. Comenzile/sesiunile anterioare noului registru necesită reconciliere înainte de schimbarea callback-ului live. |
| Netopia | Dacă se dorește reactivarea: confirmați versiunea API, POS-ul (`NETOPIA_SIGNATURE`), cheia publică oficială IPN (`NETOPIA_IPN_PUBLIC_KEY`, distinctă de cheia API), rotația cheilor și răspunsul IPN cerut de contract. Implementarea inițierii v2 și testele cu furnizorul rămân necesare. Nu activați vechiul endpoint. |
| Oblio / contabil | Confirmați `OBLIO_VAT_PERCENTAGE=21` sau eliminați valoarea veche; nomenclator TVA, CIF, seriile și stocurile activate. Confirmați `OBLIO_STOCK_DOCUMENT` (`invoice` implicit / `notice` alternativ), `OBLIO_MANAGEMENT` și `OBLIO_WORK_STATION` dacă sunt necesare. Proba documentelor și stocului se face numai după aprobare, într-un mediu adecvat. |
| Resend / operator | Cheie, domeniu/expeditor verificat `RESEND_FROM_EMAIL`, recepția confirmărilor și tratarea emailurilor restante fără întârziere nejustificată. Fallback-ul `onboarding@resend.dev` nu este dovadă de livrare pentru magazin. |
| Operator / protecția datelor | Revizie retenție, furnizori/transferuri, acces admin, fișiere/IBAN istorice, ștergere controlată și politica juridică finală. Formularul nu șterge retroactiv datele existente. |
| Vercel / dezvoltator | Rate limiting persistent / protecție contra abuzului pentru comenzile guest, mesajele, retragerile și tokenurile de upload. Nu a fost inventată o protecție în memorie care ar garanta limite între instanțe serverless. Configurația reală WAF nu a fost verificată. |
| Catalog / SEO | Corecția New Pink după validarea descrierii; SKU/gestiuni; verificări Rich Results și GSC după publicarea aprobată. |

Pentru comenzile istorice nu se face un backfill orb în `order_security` sau `payment_attempts`: datele vechi puteau proveni din totaluri nesigure. Se compară cu baza, procesatorul și documentele contabile, apoi se aprobă reconcilierea punctuală. La revenirea la o versiune veche nu se reactivează API-urile publice vulnerabile și nu se șterg registrele de plăți/retrageri care au primit date reale.

## 7. Predare către dezvoltator

1. Evaluați **întregul branch `seo-google`**, nu numai ultimul commit și nu copiați din nou corecțiile vechi. Raportul și lista de mai jos sunt pachetul unic.
2. Rulați verificările locale; confirmați că upstream nu a avansat de la `0965701`. Dacă a avansat, integrați schimbările noi în branch și retestați înainte de publicare.
3. Cu aprobarea proprietarului, pregătiți un proiect de test separat și parcurgeți tabelul de acces/configurare. Confirmați schema, fluxul de stoc și comenzile istorice înainte de schimbarea mediului live.
4. Numai după aprobarea distinctă a publicării: integrare în `main`, migrare coordonată, build nou și deploy. Corecțiile de date și testele cu servicii reale au aprobare separată.

## 8. Surse primare

- [OUG 34/2014, forma actualizată — art. 9–16 și 11¹](https://legislatie.just.ro/Public/FormaPrintabila/00000G2OMAJTEZ786L812TY06Z7HCPFX)
- [Legea 141/2025 — modificarea art. 291, cota standard 21%](https://legislatie.just.ro/Public/DetaliiDocumentAfis/305568)
- [Oblio — API, documente, idempotencyKey și useStock](https://www.oblio.eu/api/)
- [Stripe — verificarea și procesarea plăților Checkout](https://docs.stripe.com/checkout/fulfillment)
- [Netopia — SDK Python oficial](https://github.com/netopiapayments/python-sdk), verificarea IPN și constantele de status
- [Comisia Europeană — închiderea platformei ODR](https://consumer-redress.ec.europa.eu/site-relocation_en)
- [Google — date structurate Merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing)

## 9. Lista exactă a fișierelor

Manifestul de mai jos reprezintă diferența completă față de upstream `0965701`, inclusiv SEO anterior, cod, teste, migrații și documentație. `A` = adăugat, `M` = modificat, `D` = șters. Migrațiile și fișierele de dovezi sunt parte din pachet, nu operații aplicate în producție.

Total: **92 fișiere**.

| Stare | Fișier |
|---|---|
| A | `.github/workflows/seo-check.yml` |
| M | `.gitignore` |
| A | `docs/SEO-CHANGED-FILES-2026-11-15.md` |
| A | `docs/SEO-INTEGRATION-2026-11-15.md` |
| A | `docs/SEO-REVIEW-2026-10-21.md` |
| A | `docs/SEO-SECURITY-INTEGRATION-2026-11-17.md` |
| A | `docs/verification/production-checks.txt` |
| A | `docs/verification/unit-tests.txt` |
| M | `next.config.js` |
| M | `package-lock.json` |
| M | `package.json` |
| A | `scripts/seo-smoke-test.mjs` |
| M | `src/app/accesorii/layout.tsx` |
| M | `src/app/accesorii/page.tsx` |
| M | `src/app/admin/page.tsx` |
| M | `src/app/anpc/layout.tsx` |
| M | `src/app/anpc/page.tsx` |
| M | `src/app/api/contact/route.ts` |
| M | `src/app/api/netopia/callback/route.ts` |
| M | `src/app/api/netopia/route.ts` |
| M | `src/app/api/oblio/route.ts` |
| M | `src/app/api/orders/route.ts` |
| A | `src/app/api/print3d-files/route.ts` |
| M | `src/app/api/products/route.ts` |
| M | `src/app/api/sameday/route.ts` |
| M | `src/app/api/stripe/route.ts` |
| M | `src/app/api/stripe/webhook/route.ts` |
| A | `src/app/api/withdrawals/confirmations/route.ts` |
| A | `src/app/api/withdrawals/route.ts` |
| M | `src/app/checkout/page.tsx` |
| M | `src/app/componente/layout.tsx` |
| M | `src/app/componente/page.tsx` |
| M | `src/app/cont/page.tsx` |
| M | `src/app/contact/layout.tsx` |
| M | `src/app/contact/page.tsx` |
| M | `src/app/despre-noi/layout.tsx` |
| M | `src/app/despre-noi/page.tsx` |
| M | `src/app/filamente/layout.tsx` |
| M | `src/app/filamente/page.tsx` |
| M | `src/app/layout.tsx` |
| M | `src/app/page.tsx` |
| M | `src/app/payment-return/page.tsx` |
| M | `src/app/piese-imprimante-3d/page.tsx` |
| M | `src/app/politica-confidentialitate/layout.tsx` |
| M | `src/app/politica-confidentialitate/page.tsx` |
| M | `src/app/politica-gdpr/layout.tsx` |
| M | `src/app/politica-gdpr/page.tsx` |
| M | `src/app/politica-livrare/layout.tsx` |
| M | `src/app/politica-retur/layout.tsx` |
| M | `src/app/politica-retur/page.tsx` |
| M | `src/app/print3d/layout.tsx` |
| M | `src/app/print3d/page.tsx` |
| M | `src/app/product/[id]/page.tsx` |
| M | `src/app/robots.ts` |
| M | `src/app/sitemap.ts` |
| M | `src/app/termeni-conditii/layout.tsx` |
| M | `src/app/termeni-conditii/page.tsx` |
| M | `src/components/layout/Footer.tsx` |
| M | `src/components/shop/ProductCard.tsx` |
| M | `src/components/shop/ProductsPage.tsx` |
| A | `src/hooks/useContactSubmission.ts` |
| A | `src/lib/api-security.ts` |
| A | `src/lib/catalog-pagination.ts` |
| A | `src/lib/catalog-server.ts` |
| A | `src/lib/checkout-storage.ts` |
| A | `src/lib/checkout.ts` |
| A | `src/lib/contact.ts` |
| A | `src/lib/netopia-verification.ts` |
| A | `src/lib/oblio-stock.ts` |
| M | `src/lib/oblio.ts` |
| A | `src/lib/payments.ts` |
| A | `src/lib/private-files.ts` |
| A | `src/lib/seo.ts` |
| M | `src/lib/site.ts` |
| A | `src/lib/vat.ts` |
| A | `src/lib/withdrawals.ts` |
| A | `supabase/migrations/202611160001_secure_checkout.sql` |
| A | `supabase/migrations/202611160002_access_and_privacy.sql` |
| A | `supabase/migrations/202611160003_private_print_files.sql` |
| A | `supabase/migrations/202611160004_withdrawals.sql` |
| A | `tests/checkout-storage.test.ts` |
| A | `tests/contact.test.tsx` |
| A | `tests/database-security.test.ts` |
| A | `tests/fixtures/store-schema.sql` |
| A | `tests/oblio-handlers.test.ts` |
| A | `tests/payment-handlers.test.ts` |
| A | `tests/security.test.ts` |
| A | `tests/seo.test.ts` |
| A | `tests/withdrawals.test.tsx` |
| M | `tsconfig.json` |
| A | `tsconfig.test.json` |
| M | `vercel.json` |
