import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/hooks/useCart'
import { ThemeProvider } from '@/hooks/useTheme'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CookieBanner from '@/components/ui/CookieBanner'

export const metadata: Metadata = {
  title: 'TechNest — Filamente, Componente & Fabricație Digitală',
  description: 'Furnizor complet de filamente premium, componente electronice și servicii de fabricație digitală.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply theme BEFORE first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('tn_theme');
                if (t === 'light') document.documentElement.classList.add('light-mode');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <CartProvider>
            <Navbar />
            <main className="main-content">
              {children}
            </main>
            <Footer />
            <CookieBanner />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
