import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghalia Store · La mode des petits",
  description: "Vêtements pour enfants de 0 à 13 ans. Découvre la collection Ghalia Store à Ouagadougou.",
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
