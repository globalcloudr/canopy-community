import type { Metadata } from "next";
import { canopyFontVariables } from "@canopy/ui";
import { Suspense } from "react";
import { AgentationDev } from "@/app/_components/agentation-dev";
import "./globals.css";

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
    <html lang="en" className={canopyFontVariables}>
      <body className="product-community">
        <Suspense>{children}</Suspense>
        <AgentationDev />
      </body>
    </html>
  );
}
