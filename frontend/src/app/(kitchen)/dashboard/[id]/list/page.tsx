'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ShoppingListPage() {
  const params = useParams();
  const [items, setItems] = useState<string[]>([]);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/v1/projects/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjectName(data.name);
        const allIngredients = data.recipes.flatMap((r: any) => r.ingredients || []);
        setItems([...new Set(allIngredients)] as string[]);
      }
      setLoading(false);
    };
    fetchList();
  }, [params.id]);

  if (loading) return <div className="p-20 text-center font-black animate-bounce">GENEROWANIE LISTY...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen bg-slate-50">
      <Link href={`/dashboard/${params.id}`} className="text-orange-600 font-black text-[10px] uppercase tracking-widest mb-8 block">
        ← Powrót do Projektu
      </Link>

      <h1 className="text-4xl font-black uppercase italic mb-2 tracking-tighter">Lista Zakupów</h1>
      <p className="text-slate-400 font-bold uppercase text-[10px] mb-8 tracking-widest">Event: {projectName}</p>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
        {items.length > 0 ? items.map((item, idx) => (
          <label key={idx} className="flex items-center gap-4 p-6 border-b border-slate-50 hover:bg-orange-50 transition-colors cursor-pointer group">
            <input type="checkbox" className="w-6 h-6 rounded-xl border-2 border-slate-200 text-orange-600 focus:ring-orange-500 cursor-pointer" />
            <span className="font-bold text-slate-700 uppercase group-hover:text-orange-600 transition-colors">{item}</span>
          </label>
        )) : (
          <p className="p-10 text-center text-slate-400 font-bold italic">Brak składników. Dodaj dania do menu!</p>
        )}
      </div>

      <button onClick={() => window.print()} className="mt-8 w-full bg-black text-white p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95">
        🖨️ Drukuj dla zaopatrzenia
      </button>
    </div>
  );
}