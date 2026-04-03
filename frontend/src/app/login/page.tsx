"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", login);
      formData.append("password", password);

      const res = await fetch("http://localhost:8000/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        window.location.href = "/dashboard";
      } else {
        alert("Błędny login lub hasło!");
      }
    } catch (error) {
      console.error("Błąd logowania:", error);
      alert("Błąd połączenia z serwerem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="w-full max-w-md">

        <form
          onSubmit={handleLogin}
          className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-white/5"
        >
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">
              RECIPE<span className="text-orange-500">HQ</span>
            </h1>
            <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-[0.4em]">
              Kitchen Operating System
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                Identyfikator Szefa
              </label>
              <input
                type="text"
                placeholder="np. chef_adam"
                className="w-full p-5 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-800"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                Hasło dostępowe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-5 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all outline-none font-bold text-slate-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            disabled={isLoading}
            className="w-full bg-black text-white p-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs mt-10 hover:bg-orange-600 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Autoryzacja..." : "Wejdź do kuchni"}
          </button>

          {/* POPRAWIONA SEKCJA REJESTRACJI */}
          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">
              Nowy w zespole?
            </p>
            <Link
              href="/register"
              className="text-orange-600 font-black text-xs uppercase tracking-widest hover:text-black transition-colors"
            >
              Dołącz do kuchni →
            </Link>
          </div>
        </form>

        <p className="text-center text-slate-600 text-[9px] font-bold uppercase tracking-[0.3em] mt-8">
          V2.0 // Secured Connection
        </p>
      </div>
    </div>
  );
}