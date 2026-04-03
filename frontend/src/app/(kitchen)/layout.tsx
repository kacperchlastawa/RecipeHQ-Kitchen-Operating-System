"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);


  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500 border-opacity-25"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Weryfikacja uprawnień...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar będzie teraz widoczny na każdej stronie dashboardu */}
      <Navbar />

      {/* Padding top (pt-20) zapewnia, że treść nie "schowa się" pod fixed Navbarem */}
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}