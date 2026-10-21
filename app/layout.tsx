import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reaksia',
  description: 'Reaction sender untuk WhatsApp Channel.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen grid-bg">{children}</body>
    </html>
  );
}