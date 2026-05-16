import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Orchestra Hero - Aprende instrumentos de orquesta',
  description: 'Aplicación interactiva de aprendizaje musical estilo Guitar Hero para instrumentos de orquesta',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}