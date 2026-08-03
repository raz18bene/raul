export default function AdminTutorial() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📖 Tutorial Admin</h1>
        <p className="page-subtitle">Cum adaugi filtre, categorii și produse noi</p>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* 1. Ce sunt atributele */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', marginBottom: '1rem' }}>
            1. Cum funcționează filtrele
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1rem' }}>
            Filtrele din pagina de produse se generează <strong style={{ color: 'var(--text-primary)' }}>automat</strong> din câmpul <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>Atribute</code> al fiecărui produs. Nu trebuie să configurezi nimic separat — dacă 3 produse au atributul <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>Culoare: Alb</code>, apare automat filtrul de culoare cu opțiunea "Alb".
          </p>
          <div style={{ background: 'rgba(0,217,255,0.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            💡 <strong style={{ color: 'var(--primary)' }}>Exemplu:</strong> Dacă vrei filtrul de culoare la filamente, adaugă la fiecare filament atributul <code>Culoare</code> cu valoarea corespunzătoare (Alb, Negru, Roșu etc.)
          </div>
        </div>

        {/* 2. Exemplu concret - filament cu culoare */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', marginBottom: '1rem' }}>
            2. Exemplu: Adaugă filtru Culoare la Filamente
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {[
              {
                step: '1',
                title: 'Intră în Admin Panel → Produse',
                desc: 'Mergi la /admin, loghează-te, și selectează tab-ul "📦 Produse".',
              },
              {
                step: '2',
                title: 'Caută filamentul dorit',
                desc: 'Folosește bara de căutare (ex: "PLA Alb") și apasă ✏️ pentru editare.',
              },
              {
                step: '3',
                title: 'Completează câmpul "Atribute (JSON)"',
                desc: 'În câmpul Atribute, scrie un JSON cu perechile cheie-valoare. Cheia devine numele filtrului, valoarea devine opțiunea.',
                code: `{
  "Culoare": "Alb",
  "Material": "PLA",
  "Diametru": "1.75mm",
  "Gramaj": "1kg"
}`,
              },
              {
                step: '4',
                title: 'Salvează și repetă pentru toate produsele',
                desc: 'Apasă "💾 Salvează". Repetă pentru toate filamentele, folosind exact aceleași chei (cu majuscule identice): "Culoare", "Material" etc.',
              },
              {
                step: '5',
                title: 'Filtrele apar automat pe site!',
                desc: 'După ce mai multe produse au atributul "Culoare", pe pagina /filamente apare automat rândul de filtre cu butonașe colorate pentru fiecare culoare.',
              },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                  {s.step}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.3rem' }}>{s.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>{s.desc}</p>
                  {s.code && (
                    <pre style={{ marginTop: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--primary)', overflowX: 'auto' }}>
                      {s.code}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Cum arată filtrele */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', marginBottom: '1rem' }}>
            3. Cum arată pe site
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1rem' }}>
            Filtrele apar ca butonașe (chips) sub bara de căutare. Culoarea detectată automat — dacă cheia conține "culoare" sau "color", apare un cerc colorat lângă nume:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: 10 }}>
            {[
              { label: 'Culoare:', options: ['Alb ○', 'Negru ●', 'Roșu 🔴', 'Albastru 🔵', 'Verde 🟢'] },
              { label: 'Material:', options: ['PLA', 'PETG', 'ABS', 'TPU', 'ASA'] },
              { label: 'Gramaj:', options: ['0.5kg', '1kg', '2kg', '3kg'] },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: 80 }}>{row.label}</span>
                {row.options.map(opt => (
                  <span key={opt} style={{ padding: '0.3rem 0.8rem', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-page)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{opt}</span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 4. Adaugă categorie nouă */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', marginBottom: '1rem' }}>
            4. Cum adaugi o categorie nouă
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { step: '1', t: 'Supabase → Table Editor → categories', d: 'Mergi în Supabase Dashboard → Table Editor → tabelul "categories".' },
              { step: '2', t: 'Insert Row', d: 'Apasă "Insert Row" și completează: name = "Filamente PLA", slug = "filamente-pla" (fără spații, doar litere mici și cratime).' },
              { step: '3', t: 'Actualizează pagina din cod', d: 'Creează un fișier nou în src/app/ cu slug-ul categoriei și adaugă componenta ProductsPage cu categorySlug corespunzător.' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-hover)', border: '2px solid var(--primary)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  {s.step}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{s.t}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Cheat sheet */}
        <div className="card" style={{ background: 'rgba(0,217,255,0.04)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', marginBottom: '1rem' }}>
            5. Cheat Sheet — Atribute recomandate pentru Filamente
          </h2>
          <pre style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.25rem', fontFamily: 'monospace', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.8, overflowX: 'auto' }}>
{`{
  "Culoare": "Alb",          // → filtru cu cerc colorat
  "Material": "PLA",          // → filtru text
  "Diametru": "1.75mm",       // → filtru text
  "Gramaj": "1kg",            // → filtru text
  "Brand": "BambuLab",        // → filtru text
  "Finisaj": "Mat"            // → filtru text (Mat / Satinat / Lucios)
}`}
          </pre>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.75rem' }}>
            ⚠️ Folosește exact aceleași chei (cu majuscule identice) la toate produsele din aceeași categorie, altfel filtrele apar separat.
          </p>
        </div>

        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <a href="/admin" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            → Mergi în Admin Panel
          </a>
        </div>
      </div>
    </>
  )
}
