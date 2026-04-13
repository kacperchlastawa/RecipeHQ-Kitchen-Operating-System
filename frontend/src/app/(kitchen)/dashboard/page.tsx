"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/types/project";
import AddProjectModal from "@/components/AddProjectModal";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null); // Przechowuje rolę: owner, cook, dietician
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // 1. Sprawdzenie tokena i pobranie roli użytkownika
  const fetchUserInfo = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Zakładamy, że masz endpoint /users/me, który zwraca dane zalogowanego użytkownika
      const res = await fetch("http://localhost:8000/api/v1/users/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUserRole(userData.global_role); // Pobieramy 'owner', 'cook' lub 'dietician'
      }
    } catch (error) {
      console.error("Błąd pobierania danych użytkownika:", error);
    }
  }, [router]);

  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/v1/projects/", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Błąd pobierania projektów:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initDashboard = async () => {
      await fetchUserInfo();
      await fetchProjects();
    };
    initDashboard();
  }, [fetchUserInfo, fetchProjects]);

  if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Ładowanie operacji kuchennych...</div>;

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">KITCHEN OS</h1>
              {userRole && (
                <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Tryb: {userRole}
                </span>
              )}
            </div>
            <p className="text-gray-600">Aktywne projekty i eventy gastronomiczne</p>
          </div>

          {/* PRZYCISK WIDOCZNY TYLKO DLA OWNERA */}
          {userRole === 'owner' ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl active:scale-95"
            >
              + NOWY EVENT
            </button>
          ) : (
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-6 py-4 rounded-2xl border border-slate-200">
              Podgląd projektów
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          {projects.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white">
              <p className="text-gray-400 italic font-bold uppercase text-xs tracking-[0.2em]">Brak aktywnych projektów w Twojej sekcji.</p>
            </div>
          )}
        </div>
      </div>

      {/* Komponent Modala - montowany tylko dla Ownera */}
      {userRole === 'owner' && (
        <AddProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onRefresh={fetchProjects}
        />
      )}
    </main>
  );
}