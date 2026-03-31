"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState(""); // NOWE POLE
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordRepeat) {
      alert("Hasła nie są identyczne!");
      return;
    }
    if (password.length < 8) {
    alert("Hasło musi mieć co najmniej 8 znaków!");
    return;
  }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: login,
          password: password,
          repeat_password: passwordRepeat // Zgodnie ze Swaggerem
        }),
      });

      if (res.ok) {
        alert("Konto utworzone! Możesz się zalogować.");
        router.push("/login");
      } else {
        const errorData = await res.json();
        alert(`Błąd: ${JSON.stringify(errorData.detail)}`);
      }
    } catch (error) {
      console.error("Błąd sieci:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <form onSubmit={handleRegister} className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border-t-8 border-orange-500">
        <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase italic">Nowy Kucharz</h1>
        <p className="text-slate-400 mb-8 font-bold text-xs uppercase tracking-widest">Załóż konto w Kitchen OS</p>

        <div className="space-y-4">
          <input
            type="text" placeholder="Twój Login"
            className="w-full p-4 bg-slate-100 rounded-2xl border-none outline-none font-medium"
            value={login} onChange={(e) => setLogin(e.target.value)} required
          />
          <input
            type="password" placeholder="Hasło"
            className="w-full p-4 bg-slate-100 rounded-2xl border-none outline-none font-medium"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
          {/* NOWE POLE W UI */}
          <input
            type="password" placeholder="Powtórz hasło"
            className="w-full p-4 bg-slate-100 rounded-2xl border-none outline-none font-medium"
            value={passwordRepeat} onChange={(e) => setPasswordRepeat(e.target.value)} required
          />
        </div>

        <button
          disabled={loading}
          className="w-full bg-black text-white mt-8 p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
        >
          {loading ? "Przetwarzanie..." : "Zarejestruj się"}
        </button>

        <p className="mt-6 text-center text-sm text-slate-500 font-medium">
          Masz już konto? <Link href="/login" className="text-orange-500 font-bold hover:underline">Zaloguj się</Link>
        </p>
      </form>
    </div>
  );
}