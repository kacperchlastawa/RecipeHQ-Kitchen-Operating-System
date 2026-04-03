"use client";
import { useEffect, useState } from "react";
import RecipeImage from "@/components/RecipeImage"; // Importujemy Twój komponent do zdjęć

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8000/api/v1/recipes/", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRecipes(data);
        }
      } catch (error) {
        console.error("Błąd pobierania receptur:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  if (loading) return <div className="p-10 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Otwieranie księgi receptur...</div>;

  return (
    <main className="p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Baza Receptur</h1>
            <p className="text-gray-500 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">Twoja biblioteka wiedzy kulinarnej</p>
          </div>
          <button className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">
            + NOWA RECEPTURA
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {recipes.map((recipe: any) => (
            <div key={recipe.id} className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all">
              {/* ZDJĘCIE DANIA */}
              <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
                <RecipeImage src={recipe.image_url} alt={recipe.title} />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                  <span className="text-[9px] font-black uppercase text-orange-600 italic">Chef's Choice</span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-black text-xl text-slate-800 uppercase leading-none mb-2 group-hover:text-orange-500 transition-colors">
                  {recipe.title}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-2 mb-6 font-medium">
                  {recipe.description || "Brak opisu receptury."}
                </p>

                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Trudność</span>
                    <span className="text-[10px] font-black text-slate-700 uppercase">{recipe.difficulty || 'Normal'}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Czas</span>
                    <span className="text-[10px] font-black text-slate-700 uppercase">{recipe.cooking_time || '30'} MIN</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}