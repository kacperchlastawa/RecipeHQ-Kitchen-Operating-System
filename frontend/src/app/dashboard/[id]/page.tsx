"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import RecipeImage from "@/components/RecipeImage";
import AddRecipeToProjectModal from "@/components/AddRecipeToProjectModal";
import DocumentManager from "@/components/DocumentManager"; // IMPORTUJEMY NOWY KOMPONENT

export default function ProjectDetailsPage() {
  const params = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/v1/projects/${params.id}`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Pobrano świeże dane projektu:", data);
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

  // Funkcja pomocnicza do formatowania rozmiaru plików w nagłówku
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

        {/* NAGŁÓWEK PROJEKTU */}
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
              {/* WYŚWIETLAMY ZDENORMALIZOWANE DANE O ROZMIARZE PLIKÓW */}
              <div className="bg-slate-900 p-4 rounded-2xl text-center border border-slate-800 min-w-[100px]">
                 <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Storage</span>
                 <span className="text-lg font-black text-orange-400 leading-none">
                   {formatTotalSize(project.total_files_size)}
                 </span>
              </div>
            </div>
          </div>
        </header>

        {/* SEKCJA MENU */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Menu Eventu</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-black text-white px-6 py-3 rounded-xl text-xs font-black hover:bg-orange-600 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
            >
              + DODAJ DANIE
            </button>
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

        {/* SEKCJA DOKUMENTACJI (NOWA!) */}
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