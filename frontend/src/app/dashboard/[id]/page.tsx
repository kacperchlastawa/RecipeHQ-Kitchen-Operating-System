"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RecipeImage from "@/components/RecipeImage";
import AddRecipeToProjectModal from "@/components/AddRecipeToProjectModal";
import DocumentManager from "@/components/DocumentManager";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [shoppingList, setShoppingList] = useState<any>(null);
  const [isListLoading, setIsListLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/v1/projects/${params.id}`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        console.error("Błąd pobierania:", res.status);
      }
    } catch (error) {
      console.error("Błąd sieci:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateShoppingList = async () => {
    setIsListLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/v1/projects/${params.id}/shopping-list`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShoppingList(data);
      }
    } catch (error) {
      console.error("Błąd listy zakupów:", error);
    } finally {
      setIsListLoading(false);
    }
  };

  // FUNKCJA KOPIOWANIA - ZABEZPIECZONA PRZED NULL
  const copyToClipboard = () => {
    if (!shoppingList) return;
    const text = shoppingList.data
      .map((item: any) => `📍 ${item.dish.toUpperCase()}:\n${item.ingredients || "Brak podanych składników"}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    alert("Lista zakupów została skopiowana do schowka!");
  };

  const handleDeleteRecipe = async (recipeId: number) => {
    if (!confirm("Czy na pewno chcesz usunąć to danie z menu?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/projects/${params.id}/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchProjectDetails();
    } catch (error) {
      console.error("Błąd usuwania:", error);
    }
  };

  useEffect(() => {
    if (params.id) fetchProjectDetails();
  }, [params.id]);

  const formatTotalSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">Wczytywanie planu eventu...</div>;
  if (!project) return <div className="p-10 text-center text-red-500 font-bold">Nie znaleziono projektu.</div>;

  return (
    <main className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboard" className="text-orange-600 font-bold text-sm hover:underline mb-6 block uppercase tracking-tight">
          ← POWRÓT DO DASHBOARDU
        </Link>

        <header className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 bg-orange-50 px-3 py-1 rounded-full">System Operacyjny Kuchni</span>
              <h1 className="text-4xl font-black text-slate-900 mt-4 leading-none">{project.name}</h1>
              <p className="text-slate-500 mt-4 max-w-2xl font-medium">{project.description}</p>
            </div>

            <div className="flex gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 min-w-[100px]">
                 <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Data Eventu</span>
                 <span className="text-lg font-black text-slate-700 leading-none">
                   {project.event_date ? new Date(project.event_date).toLocaleDateString() : "TBD"}
                 </span>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl text-center border border-slate-800 min-w-[100px]">
                 <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Storage</span>
                 <span className="text-lg font-black text-orange-400 leading-none">
                   {formatTotalSize(project.total_files_size)}
                 </span>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Menu Eventu</h2>
            <div className="flex gap-3">
              <button
                onClick={generateShoppingList}
                disabled={isListLoading}
                className="bg-white text-black border-2 border-black px-6 py-3 rounded-xl text-xs font-black hover:bg-slate-100 transition-all shadow-md active:scale-95 uppercase tracking-widest disabled:opacity-50"
              >
                {isListLoading ? "Mielenie..." : "🛒 Lista Zakupów"}
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-black text-white px-6 py-3 rounded-xl text-xs font-black hover:bg-orange-600 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
              >
                + DODAJ DANIE
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.recipes && project.recipes.length > 0 ? (
              project.recipes.map((recipe: any) => (
                <div
                  key={recipe.id}
                  className="group relative bg-white p-4 rounded-2xl border border-slate-200 flex gap-4 items-center shadow-sm hover:shadow-md transition-all"
                >
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="absolute -top-2 -right-2 p-2 bg-white text-red-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-10 shadow-lg border border-red-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100">
                     <RecipeImage src={recipe.image_url} alt={recipe.title} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-800 text-base uppercase leading-tight">{recipe.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-medium">{recipe.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-bold uppercase text-xs tracking-widest bg-white/50">
                Menu jest puste.
              </div>
            )}
          </div>
        </section>

        {shoppingList && (
          <section className="mb-12 bg-white rounded-[2.5rem] p-8 shadow-2xl border-t-8 border-orange-500 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Zestawienie Składników</h2>
                <div className="flex gap-4 mt-2">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    Wygenerowano dla {shoppingList.total_dishes} dań
                  </p>
                  <button
                    onClick={copyToClipboard}
                    className="text-[10px] font-black text-orange-500 hover:underline uppercase tracking-widest"
                  >
                    📋 Kopiuj listę
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShoppingList(null)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {shoppingList.data.map((item: any, idx: number) => {
                // POPRAWKA: BEZPIECZNE SPLITOWANIE Z FALLBACKIEM
            const ingredientsArray = String(item.ingredients || "")
              .split(/[,\n]+/)
              .filter((i: string) => i && i.trim() !== "");

                return (
                  <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-orange-200 transition-all shadow-sm">
                    <h4 className="text-orange-500 font-black text-xs uppercase mb-4 tracking-tight flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      {item.dish}
                    </h4>

                    {ingredientsArray.length > 0 ? (
                      <ul className="space-y-2">
                        {ingredientsArray.map((ing: string, i: number) => (
                          <li key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 group-hover:border-orange-100 transition-all">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                            />
                            <span className="text-sm font-semibold text-slate-700 capitalize">
                              {ing.trim()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Brak podanych składników w recepturze.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mb-12">
          <DocumentManager
            projectId={params.id as string}
            documents={project.documents || []}
            onRefresh={fetchProjectDetails}
          />
        </section>
      </div>

      {isModalOpen && (
        <AddRecipeToProjectModal
          projectId={params.id as string}
          onClose={() => setIsModalOpen(false)}
          onAdded={() => {
            fetchProjectDetails();
            setIsModalOpen(false);
          }}
        />
      )}
    </main>
  );
}