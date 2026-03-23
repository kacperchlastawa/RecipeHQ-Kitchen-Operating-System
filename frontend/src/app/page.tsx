import Image from "next/image";
import { getRecipes } from "@/lib/api";

export default async function Home() {
  const recipes = await getRecipes();

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">
        👨‍🍳 RecipeHQ Kitchen
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {recipes.map((recipe: any) => (
          <div key={recipe.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:scale-105 transition-transform">
            <div className="relative h-48 w-full">
              <Image
                src={recipe.image_url || "/placeholder-food.jpg"}
                alt={recipe.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{recipe.title}</h2>
              <p className="text-gray-600 text-sm line-clamp-2 mb-4">{recipe.description}</p>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                  ⏱️ {recipe.cooking_time} min
                </span>
                <span className="text-gray-500 uppercase tracking-wider text-xs">
                  {recipe.difficulty}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}