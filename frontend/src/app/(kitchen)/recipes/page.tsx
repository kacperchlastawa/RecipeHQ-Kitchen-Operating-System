"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Dodany import do nawigacji
import RecipeImage from "@/components/RecipeImage";
import AddRecipeModal from "@/components/AddRecipeModal";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter(); // Inicjalizacja routera

  const fetchRecipes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/v1/recipes/", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Cache-Control": "no-cache"
        }
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

  // FUNKCJA USUWANIA
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Zatrzymuje kliknięcie, żeby nie wejść w szczegóły dania
    if (!confirm("Czy na pewno chcesz usunąć tę recepturę z bazy HQ?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/v1/recipes/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        fetchRecipes(); // Odświeżamy listę po usunięciu
      } else {
        alert("Błąd podczas usuwania.");
      }
    } catch (error) {
      console.error("Błąd sieci:", error);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  if (loading) return (
    <div className="p-10 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">
      Otwieranie księgi receptur...
    </div>
  );

  return (
    <main className="p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Baza Receptur</h1>
            <p className="text-gray-500 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">Twoja biblioteka wiedzy kulinarnej</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
          >
            + NOWA RECEPTURA
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {recipes.length > 0 ? (
            recipes.map((recipe: any) => (
              <div
                key={recipe.id}
                onClick={() => router.push(`/recipes/${recipe.id}`)} // Wejście w szczegóły
                className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer relative"
              >
                {/* PRZYCISK USUWANIA (Widoczny po hoverze) */}
                <button
                  onClick={(e) => handleDelete(e, recipe.id)}
                  className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm p-2 rounded-full text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
                  <RecipeImage src={recipe.image_url} alt={recipe.title} />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                    <span className="text-[9px] font-black uppercase text-orange-600 italic">Recipe</span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-black text-xl text-slate-800 uppercase leading-none mb-2 group-hover:text-orange-500 transition-colors italic">
                    {recipe.title}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-6 font-medium">
                    {recipe.description || "Brak opisu receptury."}
                  </p>

                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Status</span>
                      <span className="text-[10px] font-black text-slate-700 uppercase">Active</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Ref</span>
                      <span className="text-[10px] font-black text-slate-700 uppercase">#{recipe.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/50">
               <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Baza jest pusta. Dodaj pierwsze danie!</p>
            </div>
          )}
        </div>
      </div>

      <AddRecipeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchRecipes}
      />
    </main>
  );
}