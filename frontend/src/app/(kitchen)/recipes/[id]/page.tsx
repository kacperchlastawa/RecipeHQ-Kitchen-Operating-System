"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RecipeImage from "@/components/RecipeImage";
import AddRecipeModal from "@/components/AddRecipeModal"; // 1. IMPORT MODALA
import { UserRole } from "@/types/auth";

export default function RecipeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>("viewer");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // 3. STAN MODALA

  const fetchUserInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/v1/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.global_role);
      }
    } catch (error) {
      console.error("Błąd pobierania roli:", error);
    }
  }, []);

  const fetchRecipe = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/v1/recipes/${params.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecipe(data);
      }
    } catch (error) {
      console.error("Błąd:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchUserInfo();
    fetchRecipe();
  }, [fetchUserInfo, fetchRecipe]);

  // Logika: Kto może edytować? Szef, Kucharz i Dietetyk. Viewer nie.
  const canEdit = userRole !== "viewer";

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-widest text-slate-400 animate-pulse">Wczytywanie receptury...</div>;
  if (!recipe) return <div className="p-20 text-center text-red-500 font-black">Receptura nie istnieje.</div>;

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <Link href="/recipes" className="text-orange-600 font-black text-xs uppercase tracking-widest hover:underline">
          ← Powrót do bazy
        </Link>

        {/* Wskaźnik roli z innych podstron dla spójności */}
        <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
          Tryb: {userRole}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* LEWA STRONA: ZDJĘCIE I INFO */}
        <div className="space-y-6">
          <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white relative">
            <RecipeImage src={recipe.image_url} alt={recipe.title} />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
              <span className="block text-[10px] font-black text-slate-400 uppercase">Czas</span>
              <span className="text-xl font-black text-slate-900">{recipe.cooking_time} MIN</span>
            </div>
            <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
              <span className="block text-[10px] font-black text-slate-400 uppercase">Trudność</span>
              <span className="text-xl font-black text-orange-600 uppercase">{recipe.difficulty}</span>
            </div>
            <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
              <span className="block text-[10px] font-black text-slate-400 uppercase">Kalorie</span>
              <span className="text-xl font-black text-slate-900">{recipe.kcal} KCAL</span>
            </div>
          </div>
        </div>

        {/* PRAWA STRONA: SKŁADNIKI I ALERGENY */}
        <div className="space-y-8">
          <header className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none mb-4">
                {recipe.title}
              </h1>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">{recipe.description}</p>
            </div>

            {/* 4. PRZYCISK EDYCJI */}
            {canEdit && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 flex-shrink-0"
                title="Edytuj Recepturę"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </header>

          <section className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100">
            <h3 className="text-orange-600 font-black text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-600 rounded-full"></span> Składniki Receptury
            </h3>
            <ul className="grid grid-cols-1 gap-3">
              {recipe.ingredients?.map((ing: string, i: number) => (
                <li key={i} className="bg-white p-4 rounded-2xl font-bold text-slate-700 shadow-sm border border-orange-100/50 flex justify-between uppercase text-xs">
                  {ing}
                  <span className="text-orange-300">✓</span>
                </li>
              ))}
              {(!recipe.ingredients || recipe.ingredients.length === 0) && (
                <li className="text-slate-400 text-xs font-bold uppercase">Brak podanych składników.</li>
              )}
            </ul>
          </section>

          <section className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100">
            <h3 className="text-red-600 font-black text-xs uppercase tracking-[0.2em] mb-4">Alergeny i Zagrożenia</h3>
            <div className="flex flex-wrap gap-2">
              {recipe.allergens?.map((all: string, i: number) => (
                <span key={i} className="bg-white px-4 py-2 rounded-full text-[10px] font-black text-red-600 border border-red-200 uppercase shadow-sm">
                  {all}
                </span>
              ))}
              {(!recipe.allergens || recipe.allergens.length === 0) && (
                <span className="text-slate-400 text-xs font-bold uppercase">Brak wpisanych alergenów.</span>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* 5. IMPLEMENTACJA MODALA */}
      <AddRecipeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchRecipe} // Odświeża ten widok po zapisaniu zmian
        initialData={recipe} // Podaje aktualne dane do formularza
        userRole={userRole} // PRZEKAZUJEMY ROLĘ!
      />
    </main>
  );
}