import type { Metadata } from "next";
import "./globals.css";
import Providers from "../providers/Providers";

export const metadata: Metadata = {
  title: "Social Media App",
  description: "Next.js + TypeScript migration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
