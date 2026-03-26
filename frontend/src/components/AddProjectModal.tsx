'use client';
import { useState } from 'react';

export default function AddProjectModal({ isOpen, onClose, onRefresh }: {
  isOpen: boolean,
  onClose: () => void,
  onRefresh: () => void
}) {
  const [formData, setFormData] = useState({ name: '', description: '', event_date: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/v1/projects/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onRefresh(); // Odświeża listę projektów na dashboardzie
        onClose();   // Zamyka okno
        setFormData({ name: '', description: '', event_date: '' });
      }
    } catch (err) {
      alert("Błąd tworzenia eventu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-black mb-6">NOWY EVENT</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nazwa Wydarzenia</label>
            <input
              required
              className="w-full border-2 border-slate-100 rounded-lg px-4 py-2 focus:border-orange-500 outline-none transition-all"
              placeholder="np. Wesele Anny i Tomka"
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Opis (opcjonalnie)</label>
            <textarea
              className="w-full border-2 border-slate-100 rounded-lg px-4 py-2 focus:border-orange-500 outline-none transition-all h-24"
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data</label>
            <input
              type="datetime-local"
              required
              className="w-full border-2 border-slate-100 rounded-lg px-4 py-2 focus:border-orange-500 outline-none transition-all"
              onChange={e => setFormData({...formData, event_date: e.target.value})}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 font-bold text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
            >
              ANULUJ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white px-4 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50"
            >
              {loading ? "ZAPISYWANIE..." : "STWÓRZ EVENT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}