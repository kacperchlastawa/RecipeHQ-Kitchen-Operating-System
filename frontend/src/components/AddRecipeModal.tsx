"use client";
import { useState, useEffect } from "react";

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  initialData?: any; // NOWE: Opcjonalne dane do edycji
}

export default function AddRecipeModal({ isOpen, onClose, onRefresh, initialData }: AddRecipeModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cookingTime, setCookingTime] = useState(30);
  const [difficulty, setDifficulty] = useState("Medium");
  const [kcal, setKcal] = useState(500);
  const [ingredients, setIngredients] = useState("");
  const [allergens, setAllergens] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Synchronizacja stanów z danymi do edycji
  useEffect(() => {
    if (initialData && isOpen) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setCookingTime(initialData.cooking_time || 30);
      setDifficulty(initialData.difficulty || "Medium");
      setKcal(initialData.kcal || 500);
      // Backend zwraca tablice, musimy je zamienić na tekst dla textarea
      setIngredients(initialData.ingredients?.join(", ") || "");
      setAllergens(initialData.allergens?.join(", ") || "");
    } else if (!initialData && isOpen) {
      // Resetowanie pól dla nowego przepisu
      setTitle("");
      setDescription("");
      setCookingTime(30);
      setDifficulty("Medium");
      setKcal(500);
      setIngredients("");
      setAllergens("");
      setImage(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    const token = localStorage.getItem("token");

    // PRZYGOTOWANIE DANYCH
    const ingredientsArray = ingredients.split(/[,\n]+/).map(i => i.trim()).filter(i => i !== "");
    const allergensArray = allergens.split(/[,\n]+/).map(a => a.trim()).filter(a => a !== "");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("cooking_time", cookingTime.toString());
    formData.append("difficulty", difficulty);
    formData.append("kcal", kcal.toString());
    formData.append("ingredients", JSON.stringify(ingredientsArray));
    formData.append("allergens", JSON.stringify(allergensArray));

    if (image) formData.append("file", image);

    try {
      // DYNAMICZNY URL I METODA
      const url = initialData
        ? `http://localhost:8000/api/v1/recipes/${initialData.id}`
        : "http://localhost:8000/api/v1/recipes";

      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const errorData = await res.json();
        alert(`Błąd: ${JSON.stringify(errorData.detail)}`);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8 md:p-12">
          <header className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                {initialData ? "Edytuj Recepturę" : "Nowa Receptura"}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {initialData ? `Modyfikacja ID: #${initialData.id}` : "Pełna dokumentacja technologiczna"}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-colors text-3xl font-bold">×</button>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PODSTAWY */}
            <div className="grid gap-4">
               <input
                 type="text" placeholder="NAZWA DANIA"
                 className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-black uppercase outline-none"
                 value={title} onChange={(e) => setTitle(e.target.value)} required
               />
               <textarea
                 placeholder="OPIS RECEPTURY"
                 className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-medium min-h-[80px] outline-none"
                 value={description} onChange={(e) => setDescription(e.target.value)}
               />
            </div>

            {/* DANE TECHNICZNE */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Czas (min)</label>
                <input type="number" className="w-full bg-transparent font-black text-slate-700 outline-none"
                       value={cookingTime} onChange={(e) => setCookingTime(Number(e.target.value))} />
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Trudność</label>
                <select className="w-full bg-transparent font-black text-orange-600 outline-none appearance-none cursor-pointer"
                        value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="Easy">EASY</option>
                  <option value="Medium">MEDIUM</option>
                  <option value="Hard">HARD</option>
                </select>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Kcal</label>
                <input type="number" className="w-full bg-transparent font-black text-slate-700 outline-none"
                       value={kcal} onChange={(e) => setKcal(Number(e.target.value))} />
              </div>
            </div>

            {/* SKŁADNIKI I ALERGENY */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                <label className="text-[10px] font-black text-orange-600 uppercase block mb-2 italic">Składniki</label>
                <textarea
                  placeholder="jajka, mąka, mleko..."
                  className="w-full bg-white p-3 rounded-xl border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3} value={ingredients} onChange={(e) => setIngredients(e.target.value)}
                />
              </div>
              <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100">
                <label className="text-[10px] font-black text-red-600 uppercase block mb-2 italic">Alergeny</label>
                <textarea
                  placeholder="ryby, orzechy, gluten..."
                  className="w-full bg-white p-3 rounded-xl border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-red-500"
                  rows={3} value={allergens} onChange={(e) => setAllergens(e.target.value)}
                />
              </div>
            </div>

            {/* ZDJĘCIE */}
            <div className="bg-slate-900 p-6 rounded-3xl text-white">
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-3 tracking-widest">
                {initialData ? "Zmień zdjęcie (S3)" : "Multimedia (S3 Storage)"}
              </label>
              <input
                type="file" accept="image/*"
                onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-orange-500 file:text-white hover:file:bg-white hover:file:text-black transition-all cursor-pointer"
              />
            </div>

            <button
              disabled={isUploading}
              className="w-full bg-black text-white p-6 rounded-3xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 shadow-xl"
            >
              {isUploading ? "Przetwarzanie..." : (initialData ? "Zaktualizuj Recepturę" : "Dodaj do Bazy HQ")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}