"use client";
import { useState } from "react";
import { UserRole } from "@/types/auth";

export default function InviteMember({ projectId }: { projectId: string }) {
  const [login, setLogin] = useState("");
  const [role, setRole] = useState<UserRole>("cook");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const token = localStorage.getItem("token");

    // 1. Używamy FormData zamiast JSON, aby uniknąć błędu 422
    const formData = new FormData();
    formData.append("user_login", login);
    formData.append("role", role);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/projects/${projectId}/invite`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // Przy FormData NIE ustawiamy Content-Type ręcznie
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Dodano użytkownika ${login} do zespołu.` });
        setLogin("");
      } else {
        // 2. Fix dla błędu "Objects are not valid as a React child"
        // Sprawdzamy czy detail to string. Jeśli to obiekt (błąd walidacji), wyciągamy sensowny komunikat.
        let errorText = "Błąd zaproszenia";

        if (typeof data.detail === "string") {
          errorText = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Jeśli FastAPI zwróci listę błędów walidacji
          errorText = "Nieprawidłowe dane (sprawdź login i rolę)";
        }

        setMessage({ type: 'error', text: errorText });
      }
    } catch (error) {
      console.error("Błąd sieci:", error);
      setMessage({ type: 'error', text: "Błąd połączenia z serwerem." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl border border-white/5">
      <h3 className="text-xs font-black uppercase tracking-widest mb-4 italic text-orange-500">
        Zarządzaj Brygadą
      </h3>
      <form onSubmit={handleInvite} className="space-y-3">
        <input
          type="text"
          placeholder="Login użytkownika..."
          className="w-full bg-white/10 p-4 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-slate-500"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="flex-1 bg-white/10 p-4 rounded-xl text-[10px] font-black uppercase outline-none cursor-pointer"
          >
            <option value="cook" className="text-black">Kucharz</option>
            <option value="dietician" className="text-black">Dietetyk</option>
            <option value="viewer" className="text-black">Obserwator</option>
          </select>
          <button
            disabled={loading}
            className="bg-orange-600 px-6 rounded-xl font-black text-[10px] uppercase hover:bg-white hover:text-orange-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "..." : "DODAJ"}
          </button>
        </div>
      </form>

      {/* Wyświetlanie komunikatu - teraz bezpieczne, bo text to zawsze string */}
      {message && (
        <p className={`mt-3 text-[10px] font-black uppercase animate-pulse ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}