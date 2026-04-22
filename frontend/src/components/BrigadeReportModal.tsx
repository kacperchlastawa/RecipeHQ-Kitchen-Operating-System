"use client";
import { useState, useEffect } from "react";

export default function BrigadeReportModal({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      const token = localStorage.getItem("token");
      try {
        // Pamiętaj: endpoint to /reports/brigade-stats, ale w routerze /projects/
        const res = await fetch("http://localhost:8000/api/v1/projects/reports/brigade-stats", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setStats(json.data);
        }
      } catch (error) {
        console.error("Błąd pobierania raportu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200">

        {/* NAGŁÓWEK */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Raport Brygady (Raw SQL)</h2>
            <p className="text-[10px] text-orange-500 font-bold tracking-widest uppercase mt-1">Obciążenie projektowe personelu</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* TABELA */}
        <div className="p-8">
          {loading ? (
            <div className="text-center py-10 font-black uppercase text-slate-400 animate-pulse">Generowanie zapytania SQL...</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                    <th className="p-4 border-b border-slate-100">Login Kucharza</th>
                    <th className="p-4 border-b border-slate-100">Rola Globalna</th>
                    <th className="p-4 border-b border-slate-100 text-center">Ilość Projektów</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-orange-50 transition-colors group">
                      <td className="p-4 border-b border-slate-50 font-bold text-slate-700">{stat.login}</td>
                      <td className="p-4 border-b border-slate-50 text-xs font-black uppercase text-orange-600">{stat.role}</td>
                      <td className="p-4 border-b border-slate-50 text-center font-black text-xl text-slate-900">{stat.projects_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}