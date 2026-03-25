'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* LOGO I GŁÓWNA NAWIGACJA */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-orange-600 p-1.5 rounded-lg group-hover:bg-orange-700 transition-colors">
                <span className="text-white font-black text-xl leading-none">HQ</span>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Recipe<span className="text-orange-600">HQ</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors">
                🏠 Dashboard
              </Link>
              <Link href="/events" className="text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors">
                📅 Eventy Cateringowe
              </Link>
              <Link href="/recipes" className="text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors">
                📑 Baza Receptur
              </Link>
            </div>
          </div>

          {/* AKCJE UŻYTKOWNIKA (Placeholder na Auth) */}
          <div className="flex items-center gap-4">
            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>

            {/* Ten przycisk jutro zamienimy na logikę logowania */}
            <Link
              href="/login"
              className="text-sm font-bold text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg transition-all"
            >
              Zaloguj się
            </Link>

            <Link
              href="/register"
              className="text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              Dołącz do kuchni
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}