import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>TechNest</h4>
          <p>Furnizor complet de filamente premium, componente electronice și servicii de fabricație digitală.</p>
          <p style={{ marginTop: '0.5rem' }}>TECHNEST PROTOTYPING S.R.L.</p>
          <p>CUI: 52582106</p>
        </div>
        <div className="footer-section">
          <h4>Produse</h4>
          <ul>
            <li><Link href="/filamente">Filamente 3D</Link></li>
            <li><Link href="/componente">Componente Electronice</Link></li>
            <li><Link href="/print3d">Print 3D Custom</Link></li>
            <li><Link href="/accesorii">Piese Imprimante 3D</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Informații</h4>
          <ul>
            <li><Link href="/despre-noi">Despre Noi</Link></li>
            <li><Link href="/politica-livrare">Politica de Livrare</Link></li>
            <li><Link href="/politica-retur">Politica de Retur</Link></li>
            <li><Link href="/politica-confidentialitate">Confidențialitate</Link></li>
            <li><Link href="/termeni-conditii">Termeni și Condiții</Link></li>
            <li><Link href="/anpc">ANPC</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact</h4>
          <p>📍 Timișoara, 3 August 1919, nr. 21</p>
          <p>📞 <a href="tel:+40754545800">0754 545 800</a></p>
          <p>📞 <a href="tel:+40760115729">0760 115 729</a></p>
          <p>✉️ <a href="mailto:technest.prototyping@gmail.com">technest.prototyping@gmail.com</a></p>
          <p>🕐 Luni–Vineri: 16:00–22:00</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} TechNest Prototyping SRL. Toate drepturile rezervate.</p>
        <p>Plăți securizate prin Stripe</p>
      </div>
    </footer>
  )
}
