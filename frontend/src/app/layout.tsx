import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Source Company — IoT Energy Platform",
  description:
    "Industrial IoT Renewable Energy Management Platform for real-time monitoring, analytics, and fleet control of airborne wind turbine systems.",
  keywords: "renewable energy, IoT, wind turbine, industrial monitoring, energy management",
  authors: [{ name: "The Source Company" }],
  robots: "noindex, nofollow", // Private admin/customer portal
  openGraph: {
    title: "The Source Company — IoT Energy Platform",
    description: "Industrial IoT Renewable Energy Management Platform",
    siteName: "The Source Company",
    type: "website",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
