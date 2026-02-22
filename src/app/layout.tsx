import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zee Admin - Dashboard",
  description: "Admin dashboard with pixel-perfect responsive UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${quicksand.variable} ${quicksand.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
