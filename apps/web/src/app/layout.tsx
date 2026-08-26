import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "myBusiness — Plateforme de Gestion",
    template: "%s | myBusiness",
  },
  description:
    "Gérez votre centre de formation, vos membres, vos cours et bien plus avec myBusiness.",
  keywords: ["centre de formation", "gestion", "formations", "e-learning"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
