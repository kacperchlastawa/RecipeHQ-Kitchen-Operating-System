'use client';
import { useState, useEffect } from 'react';
import { getRecipes } from '@/lib/api';
import { UserRole } from "@/types/auth";
export default function AddRecipeToProjectModal({
  projectId,
  onClose,
  onAdded,
  userRole = "viewer" // 1. ODBIERAMY ROLĘ (domyślnie viewer dla bezpieczeństwa)
}: {
  projectId: string,
  onClose: () => void,
  onAdded: () => void,
  userRole?: UserRole // 2. DEFINIUJEMY JĄ W TYPACH
}) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecipes().then(data => {
      setRecipes(data);
      setLoading(false);
    });
  }, []);

  const handleAdd = async (recipeId: number) => {
    // 3. FRONT-ENDOWY STRAŻNIK: Podwójne zabezpieczenie
    if (userRole === "dietician" || userRole === "viewer") {
      alert("Brak uprawnień. Tylko Szef Kuchni i Kucharz mogą modyfikować menu.");
      return;
    }

    const token = localStorage.getItem("token");
    console.log("Próba dodania przepisu:", recipeId);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/projects/${projectId}/recipes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipe_id: recipeId })
      });

      if (res.ok) {
        console.log("Serwer potwierdził dodanie!");
        onAdded();
      } else {
        const errorData = await res.json();
        alert(`Błąd: ${errorData.detail || "Nieznany błąd"}`);
      }
    } catch (error) {
      console.error("Błąd sieciowy:", error);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
        <h2 className="text-2xl font-black mb-6 text-slate-800 uppercase italic tracking-tight">
          Wybierz danie do menu
        </h2>

        <div className="max-h-80 overflow-y-auto space-y-3 mb-6 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
          {loading ? (
            <p className="text-center py-4 text-slate-400 animate-pulse">Wczytywanie przepisów...</p>
          ) : recipes.length > 0 ? (
            recipes.map((recipe: any) => (
              <div
                key={recipe.id}
                className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all group"
              >
                <span className="font-bold text-slate-700 group-hover:text-orange-600 transition-colors">
                  {recipe.title}
                </span>

                {/* 4. Ukrywamy przycisk, jeśli ktoś nie ma uprawnień (choć i tak nie powinien tu wejść) */}
                {(userRole === "owner" || userRole === "cook") && (
                  <button
                    onClick={() => handleAdd(recipe.id)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-orange-600 hover:scale-105 transition-all active:scale-95"
                  >
                    Dodaj +
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-slate-400">Brak dostępnych przepisów.</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold text-sm uppercase tracking-widest transition-colors"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}