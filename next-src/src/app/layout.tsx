import type { Metadata } from 'next';
import './globals.css';

/* ═══════════════════════════════════════════════════════════════
 *  Root Layout — The Oasis RV Resort
 *  Wraps all pages with shared fonts, metadata, and global styles.
 * ═══════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: 'The Oasis RV Resort — Osoyoos, BC',
  description:
    'Private RV resort on Lakeshore Drive, Osoyoos. 104 privately-owned lots fronting Osoyoos Lake with pool, spa, clubhouse, and private beach.',
  keywords: [
    'Oasis RV Resort',
    'Osoyoos',
    'RV park',
    'lakefront',
    'park model',
    'British Columbia',
  ],
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
