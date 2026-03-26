"use client";
import { useEffect, useState, useCallback } from "react";
import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/types/project";
import AddProjectModal from "@/components/AddProjectModal";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/v1/projects/", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
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
    fetchProjects();
  }, [fetchProjects]);

  if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Ładowanie operacji kuchennych...</div>;

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">KITCHEN OS</h1>
            <p className="text-gray-600 mt-2">Aktywne projekty i eventy gastronomiczne</p>
          </div>

          {/* Przycisk teraz otwiera Modal */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-orange-600 transition-all shadow-lg active:scale-95"
          >
            + NOWY EVENT
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          {projects.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
              <p className="text-gray-400 italic font-medium">Brak aktywnych projektów. Stwórz pierwszy!</p>
            </div>
          )}
        </div>
      </div>

      {/* Komponent Modala */}
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchProjects}
      />
    </main>
  );
}