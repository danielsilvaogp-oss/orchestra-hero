import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Orchestra Hero - Aprende instrumentos de orquesta',
  description: 'Aplicación interactiva de aprendizaje musical estilo Guitar Hero para instrumentos de orquesta',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  )
}