'use client';
import { useState, useMemo } from 'react';

export default function AddProjectModal({ isOpen, onClose, onRefresh }: {
  isOpen: boolean,
  onClose: () => void,
  onRefresh: () => void
}) {
  const [formData, setFormData] = useState({ name: '', description: '', event_date: '' });
  const [loading, setLoading] = useState(false);

  // Obliczamy aktualny czas, aby zablokować daty wsteczne
  // useMemo zapobiega przeliczaniu tego przy każdym małym renderze
  const minDateTime = useMemo(() => {
    const now = new Date();
    // Formatowanie do YYYY-MM-DDTHH:mm (wymagane przez datetime-local)
    return now.toISOString().slice(0, 16);
  }, [isOpen]); // Przeliczamy tylko gdy otwieramy modal

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Dodatkowa walidacja "na wszelki wypadek" przed wysyłką
    if (new Date(formData.event_date) < new Date()) {
      alert("Nie możesz zaplanować eventu w przeszłości!");
      return;
    }

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
        onRefresh();
        onClose();
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
        <h2 className="text-2xl font-black mb-6 italic uppercase tracking-tighter">NOWY EVENT</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">Nazwa Wydarzenia</label>
            <input
              required
              value={formData.name}
              className="w-full border-2 border-slate-100 rounded-lg px-4 py-2 focus:border-orange-500 outline-none transition-all font-medium"
              placeholder="np. Kolacja Degustacyjna"
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">Opis (opcjonalnie)</label>
            <textarea
              value={formData.description}
              className="w-full border-2 border-slate-100 rounded-lg px-4 py-2 focus:border-orange-500 outline-none transition-all h-24 font-medium"
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">Data i Godzina</label>
            <input
              type="datetime-local"
              required
              min={minDateTime} // <--- TO BLOKUJE DATY WSTECZNE W KALENDARZU
              value={formData.event_date}
              className="w-full border-2 border-slate-100 rounded-lg px-4 py-2 focus:border-orange-500 outline-none transition-all font-bold text-slate-700"
              onChange={e => setFormData({...formData, event_date: e.target.value})}
            />
            <p className="text-[10px] text-slate-400 mt-1 italic">* Musi być późniejsza niż obecna godzina</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 font-bold text-slate-400 hover:bg-slate-50 rounded-xl transition-all uppercase text-sm"
            >
              ANULUJ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white px-4 py-3 rounded-xl font-black hover:bg-orange-600 transition-all disabled:opacity-50 uppercase text-sm tracking-widest shadow-lg"
            >
              {loading ? "ZAPISYWANIE..." : "STWÓRZ EVENT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}