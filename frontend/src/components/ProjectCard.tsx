import { Project } from "@/types/project";
import Link from 'next/link'; // Importujemy Link do nawigacji

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/dashboard/${project.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group hover:border-orange-500">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
            {project.name}
          </h3>
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Live
          </span>
        </div>

        <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
          {project.description || "Brak opisu wydarzenia."}
        </p>

        <div className="flex items-center justify-between text-gray-400 text-xs border-t pt-4">
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>{project.event_date ? new Date(project.event_date).toLocaleDateString() : "TBD"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📦</span>
            <span>{(project.total_files_size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
      </div>
    </Link>
  );
}