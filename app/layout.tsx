import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from '@/lib/site';
import { socialMetadata } from '@/lib/social-metadata';

export const metadata: Metadata = {
  ...socialMetadata(SITE_TITLE, SITE_DESCRIPTION, '/'),
  metadataBase: new URL(SITE_URL),
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
