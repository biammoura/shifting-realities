
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Shifting Realities",
    template: "%s | Shifting Realities",
  },
  description:
    "Live a thousand lives. Crie universos, conheça personagens, construa relacionamentos e viva histórias interativas com inteligência artificial.",
  applicationName: "Shifting Realities",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "S.R.",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fff4f8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="sr-app">
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
