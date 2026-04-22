"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RecipeImage from "@/components/RecipeImage"; // upewnij się, że masz ten komponent

export default function PublicMenuPage() {
  const params = useParams();
  const [menu, setMenu] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicMenu = async () => {
      try {
        // Uderzamy w endpoint /public. Brak tokena w nagłówkach!
        const res = await fetch(`http://localhost:8000/api/v1/projects/${params.id}/public`);
        if (res.ok) {
          const data = await res.json();
          setMenu(data);
        }
      } catch (error) {
        console.error("Błąd pobierania menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicMenu();
  }, [params.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 tracking-widest uppercase font-black animate-pulse">Przygotowywanie karty dań...</div>;
  if (!menu) return <div className="min-h-screen flex items-center justify-center text-red-400 font-bold">To menu nie istnieje lub wygasło.</div>;

  return (
    <main className="min-h-screen bg-[#faf9f6] text-slate-900 font-sans selection:bg-orange-200">
      <div className="max-w-4xl mx-auto px-6 py-20">

        {/* NAGŁÓWEK KARTY */}
        <div className="text-center mb-20 space-y-4">
          <p className="text-xs font-bold tracking-[0.3em] text-orange-600 uppercase">Propozycja Menu</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-slate-900">{menu.name}</h1>
          {menu.event_date && (
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Data Wydarzenia: {new Date(menu.event_date).toLocaleDateString()}
            </p>
          )}
          <p className="max-w-2xl mx-auto text-slate-500 italic mt-6">{menu.description}</p>
        </div>

        <div className="w-16 h-px bg-orange-300 mx-auto mb-20" />

        {/* LISTA DAŃ */}
        <div className="space-y-16">
          {menu.recipes?.length > 0 ? (
            menu.recipes.map((recipe: any) => (
              <div key={recipe.id} className="flex flex-col md:flex-row gap-8 items-center md:items-start group">
                <div className="w-full md:w-48 h-48 md:h-32 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-md group-hover:shadow-xl transition-all">
                  <RecipeImage src={recipe.image_url} alt={recipe.title} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-black uppercase italic tracking-tight text-slate-800 mb-3">{recipe.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{recipe.description || "Szef kuchni przygotowuje ten wyjątkowy przepis..."}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400 font-bold italic">Menu jest w trakcie opracowywania.</p>
          )}
        </div>

        {/* STOPKA */}
        <div className="mt-32 pt-10 border-t border-slate-200 text-center">
          <p className="text-[10px] font-black tracking-widest uppercase text-slate-300">Powered by RecipeHQ</p>
        </div>
      </div>
    </main>
  );
}