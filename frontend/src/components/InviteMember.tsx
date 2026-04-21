"use client";
import { useState } from "react";
import { UserRole } from "@/types/auth";

interface Participant {
  id: number;
  login: string;
  role: string;
}

export default function InviteMember({
  projectId,
  participants,
  onRefresh
}: {
  projectId: string,
  participants: Participant[],
  onRefresh: () => void
}) {
  const [login, setLogin] = useState("");
  const [role, setRole] = useState<UserRole>("cook");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("user_login", login);
    formData.append("role", role);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/projects/${projectId}/invite`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Dodano użytkownika ${login}.` });
        setLogin("");
        onRefresh(); // Odświeżamy listę po dodaniu
      } else {
        const errorText = typeof data.detail === "string" ? data.detail : "Błąd zaproszenia";
        setMessage({ type: 'error', text: errorText });
      }
    } catch (error) {
      setMessage({ type: 'error', text: "Błąd połączenia." });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: number) => {
    if (!confirm("Czy na pewno chcesz usunąć tego członka z brygady?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/projects/${projectId}/participants/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (res.ok) {
        onRefresh(); // Odświeżamy listę po usunięciu
      } else {
        alert("Błąd podczas usuwania użytkownika.");
      }
    } catch (error) {
      console.error("Błąd usuwania:", error);
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl border border-white/5">
      <h3 className="text-xs font-black uppercase tracking-widest mb-6 italic text-orange-500">
        Zarządzaj Brygadą
      </h3>

      {/* LISTA UCZESTNIKÓW */}
      <div className="space-y-3 mb-8">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Aktualny Skład:</p>
        {participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 group hover:border-white/10 transition-all">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-tight">{p.login}</span>
              <span className="text-[9px] font-bold text-orange-500 uppercase">{p.role}</span>
            </div>

            {/* Nie pozwalamy usunąć samego siebie (Ownera) w tym widoku, jeśli role == OWNER */}
            {p.role !== 'OWNER' && (
              <button
                onClick={() => handleRemove(p.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-500 transition-all text-xs font-black"
              >
                USUŃ
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="h-px bg-white/10 mb-6" />

      {/* FORMULARZ DODAWANIA */}
      <form onSubmit={handleInvite} className="space-y-3">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Dodaj do zespołu:</p>
        <input
          type="text"
          placeholder="Login użytkownika..."
          className="w-full bg-white/10 p-4 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-slate-700"
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

      {message && (
        <p className={`mt-4 text-[10px] font-black uppercase ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}