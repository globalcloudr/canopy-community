import type { Metadata } from "next";
import { Maven_Pro } from "next/font/google";
import { Suspense } from "react";
import { AgentationDev } from "@/app/_components/agentation-dev";
import "./globals.css";

const mavenPro = Maven_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-maven",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Canopy Community",
  description: "Newsletter and community communications for Canopy schools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={mavenPro.variable}>
      <body className="product-community">
        <Suspense>{children}</Suspense>
        <AgentationDev />
      </body>
    </html>
  );
}
