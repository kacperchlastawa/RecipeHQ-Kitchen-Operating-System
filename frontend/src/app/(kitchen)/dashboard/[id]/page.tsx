"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RecipeImage from "@/components/RecipeImage";
import AddRecipeToProjectModal from "@/components/AddRecipeToProjectModal";
import DocumentManager from "@/components/DocumentManager";
import InviteMember from "@/components/InviteMember";
import { UserRole } from "@/types/auth";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>("viewer");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      console.error("Błąd pobierania danych użytkownika:", error);
    }
  }, []);

  const fetchProjectDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/v1/projects/${params.id}`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (error) {
      console.error("Błąd sieci:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (params.id) {
      fetchUserInfo();
      fetchProjectDetails();
    }
  }, [params.id, router, fetchUserInfo, fetchProjectDetails]);

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

  const isOwner = userRole === "owner";
  const canAddRecipe = userRole === "owner" || userRole === "cook";

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Autoryzacja w kuchni...</div>;
  if (!project) return <div className="p-10 text-center text-red-500 font-bold">Brak dostępu do projektu.</div>;

  return (
    <main className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2">
          <Link href="/dashboard" className="text-orange-600 font-black text-[10px] hover:underline mb-8 block uppercase tracking-[0.2em]">
            ← BACK TO SYSTEM DASHBOARD
          </Link>

          <header className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200 mb-12">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-slate-900 px-4 py-1.5 rounded-full">
                    Rola: {userRole}
                  </span>
                  {project.event_date && (
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100">
                      📅 {new Date(project.event_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h1 className="text-5xl font-black text-slate-900 leading-none tracking-tighter italic uppercase">{project.name}</h1>
                <p className="text-slate-400 mt-6 max-w-xl font-medium leading-relaxed">{project.description}</p>
              </div>
            </div>
          </header>

          <section className="mb-12">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Karta Menu</h2>

              {canAddRecipe && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black hover:bg-orange-600 transition-all shadow-xl uppercase tracking-widest active:scale-95"
                  >
                    + DODAJ DANIE
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.recipes?.length > 0 ? (
                project.recipes.map((recipe: any) => (
                  <div key={recipe.id} className="group relative bg-white p-6 rounded-[2.5rem] border border-slate-200 flex gap-6 items-center shadow-sm hover:border-orange-500 transition-all">

                    {isOwner && (
                      <button
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        className="absolute -top-2 -right-2 p-3 bg-white text-red-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-20 shadow-xl border border-red-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100 shadow-inner">
                       <RecipeImage src={recipe.image_url} alt={recipe.title} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 text-lg uppercase italic leading-none mb-2">{recipe.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 font-bold uppercase tracking-tight">{recipe.difficulty} • {recipe.cooking_time} MIN</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold text-xs uppercase">
                  Brak dań w menu.
                </div>
              )}
            </div>
          </section>

          <section className="mb-12">
            <DocumentManager
              projectId={params.id as string}
              documents={project.documents || []}
              onRefresh={fetchProjectDetails}
              userRole={userRole} // FIX: Przekazujemy rolę do managera plików
            />
          </section>
        </div>

        <div className="space-y-8">
          {/* ZAPRASZANIE: Widoczne tylko dla Ownera */}
          {isOwner && (
            <InviteMember
              projectId={params.id as string}
              participants={project.participants || []}
              onRefresh={fetchProjectDetails}
            />
          )}

          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
              Operacje Kuchenne
            </h3>
            <button
              onClick={() => router.push(`/dashboard/${params.id}/shopping-list`)} // FIX: Bezwzględna ścieżka
              className="w-full bg-slate-50 text-slate-800 p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all flex items-center justify-between group"
            >
              🛒 Lista Zakupów
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AddRecipeToProjectModal
          projectId={params.id as string}
          userRole={userRole}
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