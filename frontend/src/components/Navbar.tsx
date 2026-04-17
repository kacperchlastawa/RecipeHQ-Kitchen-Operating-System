'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>("Wczytywanie...");

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('http://localhost:8000/api/v1/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setUserRole(data.global_role);
        } else {
          setUserRole("Nieznany");
        }
      } catch (error) {
        console.error("Błąd pobierania roli do Navbara:", error);
        setUserRole("Brak sieci");
      }
    };

    fetchUserRole();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  // Słownik tłumaczący rolę z bazy na elegancki tekst do interfejsu
  const roleDisplayNames: Record<string, string> = {
    owner: "Szef Kuchni",
    cook: "Kucharz",
    dietician: "Dietetyk",
    viewer: "Obserwator"
  };

  const displayRole = roleDisplayNames[userRole] || userRole.toUpperCase();

  return (
    <nav className="bg-black text-white border-b border-white/10 sticky top-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">

          {/* LOGO I GŁÓWNA NAWIGACJA */}
          <div className="flex items-center gap-12">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="bg-orange-600 p-2 rounded-xl group-hover:rotate-6 transition-transform">
                <span className="text-white font-black text-xl leading-none">HQ</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-white leading-none">
                  RECIPE<span className="text-orange-500">HQ</span>
                </span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">Kitchen OS</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/dashboard"
                className={`text-[10px] font-black uppercase tracking-widest transition-all hover:text-orange-500 ${
                  isActive('/dashboard') ? 'text-orange-500' : 'text-slate-400'
                }`}
              >
                🏠 Dashboard
              </Link>
              <Link
                href="/recipes"
                className={`text-[10px] font-black uppercase tracking-widest transition-all hover:text-orange-500 ${
                  isActive('/recipes') ? 'text-orange-500' : 'text-slate-400'
                }`}
              >
                📑 Baza Receptur
              </Link>
            </div>
          </div>

          {/* AKCJE UŻYTKOWNIKA */}
          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-right border-l border-white/10 pl-6">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
              <p className={`text-xs font-black uppercase italic ${userRole === 'owner' ? 'text-orange-500' : 'text-white'}`}>
                {displayRole}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="text-[10px] font-black text-white bg-white/5 hover:bg-red-600 border border-white/10 hover:border-red-600 px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 uppercase tracking-widest"
            >
              Wyloguj się
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}