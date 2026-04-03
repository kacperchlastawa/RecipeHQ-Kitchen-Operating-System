import type { Metadata } from "next";
import "./globals.css";

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
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </body>
    </html>
  );
}