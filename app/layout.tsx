
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bouldering Log',
  description: 'Track your climbing progression',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
