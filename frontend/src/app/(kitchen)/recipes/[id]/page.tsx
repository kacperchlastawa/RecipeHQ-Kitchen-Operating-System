"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RecipeImage from "@/components/RecipeImage";

export default function RecipeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
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
    };
    fetchRecipe();
  }, [params.id]);

  if (loading) return <div className="p-20 text-center font-black uppercase animate-pulse">Ładowanie receptury...</div>;
  if (!recipe) return <div className="p-20 text-center text-red-500 font-black">Receptura nie istnieje.</div>;

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <Link href="/recipes" className="text-orange-600 font-black text-xs uppercase tracking-widest hover:underline mb-8 block">
        ← Powrót do bazy
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* LEWA STRONA: ZDJĘCIE I INFO */}
        <div className="space-y-6">
          <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
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
          <header>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none mb-4">
              {recipe.title}
            </h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">{recipe.description}</p>
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
            </ul>
          </section>

          <section className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100">
            <h3 className="text-red-600 font-black text-xs uppercase tracking-[0.2em] mb-4">Alergeny i Zagrożenia</h3>
            <div className="flex flex-wrap gap-2">
              {recipe.allergens?.map((all: string, i: number) => (
                <span key={i} className="bg-white px-4 py-2 rounded-full text-[10px] font-black text-red-600 border border-red-200 uppercase">
                  {all}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}