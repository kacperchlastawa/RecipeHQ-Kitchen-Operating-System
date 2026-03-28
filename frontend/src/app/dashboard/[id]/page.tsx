"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import RecipeImage from "@/components/RecipeImage";
import AddRecipeToProjectModal from "@/components/AddRecipeToProjectModal";

export default function ProjectDetailsPage() {
  const params = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      // DODANO cache: 'no-store', aby wymusić pobranie świeżych danych z bazy
      const res = await fetch(`http://localhost:8000/api/v1/projects/${params.id}`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Pobrano świeże dane projektu z bazy:", data);
        setProject(data);
      } else {
        console.error("Serwer zwrócił błąd przy pobieraniu projektu:", res.status);
      }
    } catch (error) {
      console.error("Błąd sieci podczas pobierania szczegółów:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchProjectDetails();
  }, [params.id]);

  if (loading) return <div className="p-10 text-center">Wczytywanie planu eventu...</div>;
  if (!project) return <div className="p-10 text-center">Nie znaleziono projektu.</div>;

  return (
    <main className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboard" className="text-orange-600 font-bold text-sm hover:underline mb-6 block">
          ← POWRÓT DO DASHBOARDU
        </Link>

        <header className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-orange-500">Szczegóły Projektu</span>
              <h1 className="text-4xl font-black text-slate-900 mt-2">{project.name}</h1>
              <p className="text-slate-500 mt-4 max-w-2xl">{project.description}</p>
            </div>
            <div className="bg-slate-100 p-4 rounded-2xl text-center min-w-[120px]">
               <span className="block text-xs font-bold text-slate-400 uppercase">Data</span>
               <span className="text-lg font-black text-slate-700">
                 {project.event_date ? new Date(project.event_date).toLocaleDateString() : "TBD"}
               </span>
            </div>
          </div>
        </header>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic">Menu Eventu</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-black text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg active:scale-95"
            >
              + DODAJ DANIE DO MENU
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.recipes && project.recipes.length > 0 ? (
              project.recipes.map((recipe: any) => (
                <div key={recipe.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                     <RecipeImage src={recipe.image_url} alt={recipe.title} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-extrabold text-slate-800 text-lg uppercase">{recipe.title}</h4>
                    <p className="text-sm text-slate-400 line-clamp-2 mt-1">{recipe.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-16 text-center border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 italic bg-white/50">
                Menu jest jeszcze puste. Kliknij przycisk powyżej, aby dodać pierwsze danie!
              </div>
            )}
          </div>
        </section>
      </div>

      {isModalOpen && (
        <AddRecipeToProjectModal
          projectId={params.id as string}
          onClose={() => setIsModalOpen(false)}
          onAdded={() => {
            console.log("Danie dodane, odświeżam dane projektu...");
            fetchProjectDetails();
            setIsModalOpen(false);
          }}
        />
      )}
    </main>
  );
}