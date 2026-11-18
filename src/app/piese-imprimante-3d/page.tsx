import { permanentRedirect } from 'next/navigation'

// Ruta veche pentru accesorii se consolideaza pe pagina canonica din magazin.
export default function PieseImprimante3DPage() {
  permanentRedirect('/accesorii')
}
