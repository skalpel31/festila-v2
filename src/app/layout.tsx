import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Festila — Des événements inoubliables',
  description: 'Créez et partagez votre événement en quelques minutes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
