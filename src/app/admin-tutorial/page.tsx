export default function AdminTutorial() {
  const card = (children: React.ReactNode) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {children}
    </div>
  )

  const step = (num: number, title: string, desc: React.ReactNode) => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0,
      }}>{num}</div>
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{title}</p>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>{desc}</div>
      </div>
    </div>
  )

  const tip = (text: React.ReactNode, icon = '💡') => (
    <div style={{ background: 'rgba(0,217,255,0.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.9rem 1rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
      {icon} {text}
    </div>
  )

  const warn = (text: React.ReactNode) => (
    <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 10, padding: '0.9rem 1rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
      ⚠️ {text}
    </div>
  )

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📖 Tutorial Admin</h1>
        <p className="page-subtitle">Ghid complet: filtre, produse, poze, comenzi</p>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* SECTIUNEA 1: CREARE FILTRU */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.2rem' }}>
            1. Creare filtru nou
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Filtrele (Culoare, Material, Gramaj etc.) se gestionează din tab-ul <strong style={{ color: 'var(--primary)' }}>🏷️ Filtre</strong> din Admin Panel. Nu trebuie să intri în Supabase.
          </p>
          {step(1, 'Mergi în Admin Panel → tab "🏷️ Filtre"', 'Apasă tab-ul "Filtre" din meniul de sus al paginii /admin.')}
          {step(2, 'Secțiunea "Creează filtru nou"', (
            <span>Completează cele două câmpuri:<br />
              • <strong>Nume filtru (cheie)</strong> — ex: <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 4 }}>Culoare</code><br />
              • <strong>Valoare implicită</strong> — ex: <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 4 }}>Alb</code>
            </span>
          ))}
          {step(3, 'Apasă "Creează filtrul"', 'Filtrul va fi adăugat automat la toate produsele care nu îl aveau încă.')}
          {warn('Dacă pui valoarea implicită "Alb", toate produsele vor primi "Culoare: Alb". Schimbă valoarea individual pentru fiecare produs din secțiunea 2.')}
        </div>

        {/* SECTIUNEA 2: ATRIBUIRE */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.2rem' }}>
            2. Atribuire filtru la un produs specific
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            După ce ai creat filtrul, setezi valoarea corectă pentru fiecare produs. Exemplu: "PLA Negru 1kg" → Culoare: Negru.
          </p>
          {step(1, 'Secțiunea "Atribuie filtru la un produs specific"', 'Selectează produsul din lista dropdown.')}
          {step(2, 'Verifică filtrele curente', 'Apar automat atributele pe care le are deja produsul selectat.')}
          {step(3, 'Completează "Filtru" și "Valoare"', (
            <span>
              Ex: Filtru = <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 4 }}>Culoare</code>, Valoare = <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 4 }}>Negru</code>
            </span>
          ))}
          {step(4, 'Apasă "Atribuie"', 'Se salvează instant. Pe site apare imediat în secțiunea de filtre.')}
          {tip('Câmpurile au autocompletare — după ce ai atribuit "Culoare: Negru" o dată, valoarea apare ca sugestie data viitoare.')}

          {/* Example table */}
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Exemplu concret — Filamente:</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)' }}>
                    {['Produs', 'Filtru', 'Valoare', 'Rezultat pe site'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['PLA Alb 1kg',       'Culoare', 'Alb',      '⚪ Buton "Alb"'],
                    ['PLA Negru 1kg',      'Culoare', 'Negru',    '⚫ Buton "Negru"'],
                    ['PETG Albastru 1kg',  'Culoare', 'Albastru', '🔵 Buton "Albastru"'],
                    ['PLA Alb 1kg',        'Material','PLA',      'Buton text "PLA"'],
                    ['PETG Albastru 1kg',  'Material','PETG',     'Buton text "PETG"'],
                    ['PLA Alb 1kg',        'Gramaj',  '1kg',      'Buton text "1kg"'],
                  ].map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--bg-hover)' }}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ padding: '0.45rem 0.75rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTIUNEA 3: FILTRE EXISTENTE */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.2rem' }}>
            3. Gestionare filtre existente
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            În secțiunea <strong style={{ color: 'var(--primary)' }}>"Filtre existente"</strong> din tab-ul Filtre poți vedea toate filtrele active.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              ['🗑️ "Șterge filtrul"', 'Șterge întreaga cheie (ex: "Culoare") de la TOATE produsele.'],
              ['✕ pe un chip', 'Șterge doar acea valoare (ex: "Roșu") de la produsele care o au.'],
              ['Autocompletare', 'Când adaugi un filtru nou, cheile și valorile existente apar ca sugestii.'],
            ].map(([label, desc]) => (
              <div key={label as string} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--primary)', minWidth: 140, fontFamily: 'var(--font-display)', fontSize: '0.88rem' }}>{label}</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTIUNEA 4: PRODUSE */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.2rem' }}>
            4. Adăugare / editare produs
          </h2>
          {step(1, 'Tab "📦 Produse" → buton "➕ Produs Nou"', 'Sau apasă ✏️ pe un produs existent pentru editare.')}
          {step(2, 'Completează câmpurile', 'Nume, descriere, preț, preț redus, stoc, SKU, categorie.')}
          {step(3, 'Poze Produs', 'Apasă "📷 Adaugă poze" pentru a selecta imagini de pe calculator. Prima poză = poza principală (badge "MAIN"). Apasă X pentru a șterge o poză.')}
          {step(4, 'Apasă "💾 Salvează"', 'Produsul apare imediat pe site.')}
          {tip('Recomandare poze: pătrate, minim 800×800px, format JPG sau PNG.', '📸')}
        </div>

        {/* SECTIUNEA 5: COMENZI */}
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '1.2rem' }}>
            5. Procesare comenzi
          </h2>
          {step(1, 'Tab "🛒 Comenzi"', 'Toate comenzile apar în ordine cronologică inversă (cele mai noi primul).')}
          {step(2, 'Click pe o comandă', 'Se deschide modalul cu detalii complete: client, adresă, produse, total.')}
          {step(3, 'Schimbă statusul', (
            <span>
              Din dropdown selectezi statusul:<br />
              <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 4 }}>pending</code> → <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 4 }}>processing</code> → <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 4 }}>shipped</code> → <code style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: 4 }}>delivered</code>
            </span>
          ))}
          {step(4, 'Generează AWB SameDay', 'Pentru comenzile cu livrare SameDay, apasă "🚚 Generează AWB SameDay". AWB-ul apare imediat și statusul devine "shipped".')}
          {step(5, 'Apasă "💾 Salvează Modificările"', 'Statusul se actualizează în baza de date.')}
        </div>

        <div style={{ textAlign: 'center', paddingBottom: '1rem' }}>
          <a href="/admin" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            → Mergi în Admin Panel
          </a>
        </div>

      </div>
    </>
  )
}
