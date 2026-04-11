import type { Metadata } from "next";
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
    <html lang="en">
      <body>
        <Suspense>{children}</Suspense>
        <AgentationDev />
      </body>
    </html>
  );
}
