"use client";
import { useState } from "react";

export default function InviteMember({ projectId }: { projectId: string }) {
  const [login, setLogin] = useState("");
  const [role, setRole] = useState("cook");
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

      if (res.ok) {
        setMessage({ type: 'success', text: `Dodano użytkownika ${login} do zespołu.` });
        setLogin("");
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.detail || "Błąd zaproszenia" });
      }
    } catch (error) {
      setMessage({ type: 'error', text: "Błąd połączenia z serwerem." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
      <h3 className="text-xs font-black uppercase tracking-widest mb-4 italic text-orange-500">
        Zarządzaj Brygadą
      </h3>
      <form onSubmit={handleInvite} className="space-y-3">
        <input
          type="text"
          placeholder="Login użytkownika..."
          className="w-full bg-white/10 p-4 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-orange-500"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="flex-1 bg-white/10 p-4 rounded-xl text-[10px] font-black uppercase outline-none"
          >
            <option value="cook" className="text-black">Kucharz</option>
            <option value="dietician" className="text-black">Dietetyk</option>
            <option value="viewer" className="text-black">Obserwator</option>
          </select>
          <button
            disabled={loading}
            className="bg-orange-600 px-6 rounded-xl font-black text-[10px] uppercase hover:bg-white hover:text-orange-600 transition-all"
          >
            {loading ? "..." : "DODAJ"}
          </button>
        </div>
      </form>
      {message && (
        <p className={`mt-3 text-[10px] font-black uppercase ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}