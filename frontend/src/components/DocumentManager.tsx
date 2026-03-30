"use client";
import { useState } from "react";

interface Document {
  id: number;
  file_name: str;
  file_size: number;
  mime_type: string;
  upload_at: string;
}

export default function DocumentManager({
  projectId,
  documents,
  onRefresh
}: {
  projectId: string;
  documents: Document[];
  onRefresh: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:8000/api/v1/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        onRefresh();
      } else {
        alert("Błąd podczas wgrywania pliku.");
      }
    } catch (error) {
      console.error("Błąd uploadu:", error);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="mt-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 uppercase italic">Dokumentacja i Media</h2>
        <label className={`cursor-pointer bg-orange-100 text-orange-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-orange-600 hover:text-white transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? "WGRYWANIE..." : "+ DODAJ PLIK"}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="space-y-3">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-orange-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  {doc.mime_type.includes("image") ? "🖼️" : "📄"}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{doc.file_name}</p>
                  <p className="text-xs text-slate-400">{formatSize(doc.file_size)} • {new Date(doc.upload_at).toLocaleDateString()}</p>
                </div>
              </div>
              <a
                href={`http://localhost:8000/${doc.s3_key}`}
                target="_blank"
                className="text-xs font-bold text-slate-400 hover:text-orange-600 uppercase tracking-wider"
              >
                Pobierz
              </a>
            </div>
          ))
        ) : (
          <p className="text-center py-10 text-slate-400 italic">Brak wgranych dokumentów (HACCP, zdjęcia plate-up).</p>
        )}
      </div>
    </div>
  );
}