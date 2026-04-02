import { Project } from "@/types/project";
import Link from 'next/link';

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/dashboard/${project.id}`}>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 hover:shadow-xl transition-all cursor-pointer group hover:border-orange-500 relative overflow-hidden">

        {/* Dekoracyjny akcent kolorystyczny na górze */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-orange-500 transition-colors" />

        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1 block">
              Event Gastronomiczny
            </span>
            <h3 className="text-xl font-black text-slate-900 group-hover:text-orange-600 transition-colors leading-tight">
              {project.name}
            </h3>
          </div>
          <span className="bg-green-50 text-green-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-green-100">
            Aktywny
          </span>
        </div>

        <p className="text-slate-500 text-sm line-clamp-2 mb-6 h-10 font-medium">
          {project.description || "Brak opisu wydarzenia. Dodaj instrukcje dla zespołu."}
        </p>

        {/* STATYSTYKI ZDENORMALIZOWANE */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-5">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Data</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs font-black text-slate-700">
                {project.event_date ? new Date(project.event_date).toLocaleDateString() : "TBD"}
              </span>
            </div>
          </div>

          <div className="flex flex-col border-x border-slate-50 px-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Dania (SQL)</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs font-black text-orange-600">
                {project.recipes_count || 0}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase italic">szt.</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Media</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs font-black text-slate-700">
                {(project.total_files_size / 1024 / 1024).toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase italic">MB</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}