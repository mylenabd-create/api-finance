import type { Metadata, Viewport } from "next";
import { Poppins, IBM_Plex_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { PwaRegister } from "@/components/PwaRegister";
import { BASE_PATH } from "@/lib/basePath";
import "./globals.css";

// Manual de Identidade Visual CERNE: Poppins é a família tipográfica do app.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Cerne",
  description: "Organize sua vida. Encontre seu centro.",
  applicationName: "Cerne",
  manifest: `${BASE_PATH}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Cerne",
  },
  icons: {
    icon: [
      { url: `${BASE_PATH}/icons/favicon-48.png`, sizes: "48x48", type: "image/png" },
      { url: `${BASE_PATH}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
    ],
    apple: { url: `${BASE_PATH}/icons/apple-touch-icon.png`, sizes: "180x180" },
  },
};

export const viewport: Viewport = {
  themeColor: "#31004f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <AppShell>{children}</AppShell>
        <PwaRegister />
      </body>
    </html>
  );
}
