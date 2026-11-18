export default function PoliticaConfidentialitate() {
  return <>
    <div className="page-header"><h1 className="page-title">Politica de Confidențialitate</h1><p className="page-subtitle">Ultima actualizare: 17 noiembrie 2026</p></div>
    <div className="card" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {[
  {
    "t": "1. Operator și date prelucrate",
    "c": "Operatorul este TECHNEST PROTOTYPING S.R.L., CUI 52582106. Prelucrăm numele, datele de contact și de livrare/facturare, comenzile, mesajele și declarațiile de retragere. Pentru ofertele de printare 3D prelucrăm și fișierele încărcate. Nu introduceți date de card, documente de identitate sau informații confidențiale care nu sunt necesare solicitării."
  },
  {
    "t": "2. Scopuri și temeiuri",
    "c": "Folosim datele pentru pregătirea ofertelor la cererea dumneavoastră, executarea contractelor, comunicarea despre comenzi, îndeplinirea obligațiilor fiscale și a drepturilor consumatorilor. Protejarea site-ului și gestionarea solicitărilor se bazează și pe interesul legitim de a menține un serviciu sigur. Reținerea opțională a datelor de livrare în browser se bazează pe alegerea dumneavoastră. Nu condiționăm retragerea din contract de consimțământ pentru marketing."
  },
  {
    "t": "3. Furnizori și destinatari",
    "c": "Datele necesare sunt prelucrate prin Supabase (baza de date și fișiere), Vercel (găzduire), Resend și furnizorul de email (mesaje), Stripe (plăți), Oblio (documente fiscale) și SameDay (livrare), în funcție de serviciul utilizat. Nu vindem datele personale. Datele de card sunt gestionate de procesatorul de plăți, nu prin formularele de contact ale magazinului."
  },
  {
    "t": "4. Mesaje, retrageri și informații bancare",
    "c": "Mesajele și declarațiile sunt salvate în baza de date și pot fi transmise prin email. Formularul de retragere nu solicită IBAN. Dacă un IBAN a fost inclus într-o cerere anterioară sau într-un mesaj liber, acesta poate exista în înregistrarea cererii și în emailurile aferente. Pentru o rambursare prin altă metodă decât cea inițială vă cerem acordul și numai informațiile necesare."
  },
  {
    "t": "5. Fișiere pentru printare și acces",
    "c": "Fișierele pentru cereri de printare sunt destinate personalului autorizat care evaluează proiectul. Noua încărcare folosește un spațiu separat cu acces privat și linkuri temporare pentru administrator. Pentru informații despre un fișier trimis anterior sau o cerere de ștergere, contactați-ne. Nu includeți date ale altor persoane dacă nu aveți dreptul de a le transmite."
  },
  {
    "t": "6. Păstrare și transferuri",
    "c": "Păstrăm datele numai pentru durata necesară ofertării, contractelor, soluționării solicitărilor și obligațiilor legale de arhivare. Cererile de ștergere sunt evaluate ținând cont de aceste obligații. Infrastructura furnizorilor poate implica transferuri în afara Spațiului Economic European; informații despre destinatari, localizarea aplicabilă și garanțiile transferului pot fi solicitate la adresa de contact."
  },
  {
    "t": "7. Drepturile dumneavoastră",
    "c": "Puteți solicita acces, rectificare, ștergere, restricționare, portabilitate sau vă puteți opune prelucrării, în condițiile GDPR. Dacă o prelucrare se bazează pe consimțământ, îl puteți retrage. Răspundem, de regulă, în termen de o lună; o prelungire permisă de lege va fi comunicată cu motivul ei. Aveți dreptul de a depune plângere la ANSPDCP, www.dataprotection.ro."
  },
  {
    "t": "8. Date în browser",
    "c": "Site-ul poate păstra local coșul, preferințele de afișare și sesiunea contului. Datele de livrare se rețin pentru 30 de zile numai dacă bifați opțiunea din checkout; debifarea șterge copia locală. Copiile vechi fără această opțiune sau expirate sunt eliminate când reveniți în checkout. Puteți șterge toate datele site-ului din setările browserului. Evitați salvarea datelor pe dispozitive folosite în comun."
  },
  {
    "t": "9. Contact pentru date personale",
    "c": "Scrieți la technest.prototyping@gmail.com sau sunați la 0754 545 800. Identificați cererea sau comanda fără să trimiteți date de card ori copii de acte nesolicitate."
  }
].map(s => <section key={s.t}><h2>{s.t}</h2><p style={{ lineHeight: 1.8 }}>{s.c}</p></section>)}
    </div>
  </>
}
