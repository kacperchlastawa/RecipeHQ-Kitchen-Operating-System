// src/app/page.tsx
import { getRecipes } from "@/lib/api";
import RecipeImage from "@/components/RecipeImage";

export default async function Home() {
  const recipes = await getRecipes();

  return (
    <main className="min-h-screen p-8 bg-slate-50">
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            RecipeHQ <span className="text-orange-600">Kitchen OS</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Operacyjne Menu i Dokumentacja Plate-up</p>
        </div>
        <div className="text-right text-xs text-slate-400 font-mono">
          SERVER TIME: 2026.03.26
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {recipes.map((recipe: any) => (
          <div key={recipe.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="relative h-56 w-full bg-slate-100">
              {/* Nasz naprawiony komponent obrazka */}
              <RecipeImage src={recipe.image_url} alt={recipe.title} />

              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                ID: #{recipe.id}
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-slate-800 leading-tight">
                  {recipe.title}
                </h2>
                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded font-black ${
                  recipe.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {recipe.difficulty}
                </span>
              </div>

              <p className="text-slate-600 text-sm mb-6 line-clamp-2">
                {recipe.description}
              </p>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <span className="text-slate-400 text-xs">Czas:</span>
                   <span className="font-bold text-slate-700 text-sm">{recipe.cooking_time} min</span>
                </div>
                <button className="text-orange-600 font-bold text-sm hover:text-orange-700">
                  SZCZEGÓŁY →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}