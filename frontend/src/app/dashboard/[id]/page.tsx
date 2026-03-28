"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RecipeImage from "@/components/RecipeImage";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8000/api/v1/projects/${params.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setProject(data);
        } else {
          console.error("Nie udało się pobrać szczegółów projektu");
        }
      } catch (error) {
        console.error("Błąd sieci:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchProjectDetails();
  }, [params.id]);

  if (loading) return <div className="p-10 text-center">Wczytywanie planu eventu...</div>;
  if (!project) return <div className="p-10 text-center">Nie znaleziono projektu.</div>;

  return (
    <main className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Przycisk powrotu */}
        <Link href="/dashboard" className="text-orange-600 font-bold text-sm hover:underline mb-6 block">
          ← POWRÓT DO DASHBOARDU
        </Link>

        <header className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-orange-500">Event Details</span>
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

        {/* Sekcja Menu (Przepisy) */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-900">MENU EVENTU</h2>
            <button className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all">
              + DODAJ DANIE
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.recipes?.map((recipe: any) => (
              <div key={recipe.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4 items-center">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                   <RecipeImage src={recipe.image_url} alt={recipe.title} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{recipe.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{recipe.description}</p>
                </div>
              </div>
            ))}
            {(!project.recipes || project.recipes.length === 0) && (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 italic">
                Menu jest jeszcze puste. Dodaj pierwsze danie!
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}