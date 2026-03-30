"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append("username", login); // FastAPI domyślnie szuka 'username'
    formData.append("password", password);

    const res = await fetch("http://localhost:8000/api/v1/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.access_token); // ZAPISUJEMY TOKEN
      router.push("/dashboard"); // PRZEKIEROWANIE
    } else {
      alert("Błędny login lub hasło!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase italic">RecipeHQ</h1>
        <p className="text-slate-400 mb-8 font-bold text-sm uppercase tracking-widest">Kitchen OS Login</p>

        <input
          type="text" placeholder="Login (np. chef)"
          className="w-full p-4 mb-4 bg-slate-100 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
          value={login} onChange={(e) => setLogin(e.target.value)}
        />
        <input
          type="password" placeholder="Hasło"
          className="w-full p-4 mb-8 bg-slate-100 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-orange-500 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all">
          Zaloguj się
        </button>
      </form>
    </div>
  );
}