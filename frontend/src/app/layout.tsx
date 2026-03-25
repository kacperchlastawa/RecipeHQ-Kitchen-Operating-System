import type { Metadata } from "next";
import { Inter } from "next/font-awesome";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "RecipeHQ | Kitchen Operating System",
  description: "Zarządzanie recepturami i dokumentacją technologiczną w profesjonalnej kuchni.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased bg-slate-50">
        <Navbar />
        {/* Tutaj będą renderowane wszystkie strony, np. page.tsx */}
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </body>
    </html>
  );
}