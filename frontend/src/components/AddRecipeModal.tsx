"use client";
import { useState, useEffect } from "react";

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  initialData?: any;
  userRole?: string; // Przyjmuje: 'owner', 'cook', 'dietician', 'viewer'
}

export default function AddRecipeModal({
  isOpen,
  onClose,
  onRefresh,
  initialData,
  userRole = "viewer"
}: AddRecipeModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cookingTime, setCookingTime] = useState(30);
  const [difficulty, setDifficulty] = useState("Medium");
  const [kcal, setKcal] = useState(500);
  const [ingredients, setIngredients] = useState("");
  const [allergens, setAllergens] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // LOGIKA UPRAWNIEŃ (Frontend Guard)
  const canEdit = (field: string) => {
    if (userRole === "owner") return true;
    if (userRole === "cook") {
      return ["title", "description", "cooking_time", "difficulty", "ingredients", "file"].includes(field);
    }
    if (userRole === "dietician") {
      return ["kcal", "allergens", "file"].includes(field);
    }
    return false; // viewer nie może nic
  };

  const isFieldDisabled = (field: string) => !canEdit(field);

  // Styl dla zablokowanych pól
  const disabledStyles = "bg-slate-100 text-slate-400 cursor-not-allowed opacity-70 border-slate-200";
  const enabledStyles = "bg-slate-50 focus:ring-2 focus:ring-orange-500 border-transparent";

  useEffect(() => {
    if (initialData && isOpen) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setCookingTime(initialData.cooking_time || 30);
      setDifficulty(initialData.difficulty || "Medium");
      setKcal(initialData.kcal || 500);
      setIngredients(initialData.ingredients?.join(", ") || "");
      setAllergens(initialData.allergens?.join(", ") || "");
    } else if (!initialData && isOpen) {
      setTitle(""); setDescription(""); setCookingTime(30); setDifficulty("Medium");
      setKcal(500); setIngredients(""); setAllergens(""); setImage(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === "viewer") return; // Dodatkowe zabezpieczenie

    setIsUploading(true);
    const token = localStorage.getItem("token");

    const ingredientsArray = ingredients.split(/[,\n]+/).map(i => i.trim()).filter(i => i !== "");
    const allergensArray = allergens.split(/[,\n]+/).map(a => a.trim()).filter(a => a !== "");

    const formData = new FormData();
    // Wysyłamy pola tylko jeśli rola ma do nich prawo (dobra praktyka)
    if (canEdit("title")) formData.append("title", title);
    if (canEdit("description")) formData.append("description", description);
    if (canEdit("cooking_time")) formData.append("cooking_time", cookingTime.toString());
    if (canEdit("difficulty")) formData.append("difficulty", difficulty);
    if (canEdit("kcal")) formData.append("kcal", kcal.toString());
    if (canEdit("ingredients")) formData.append("ingredients", JSON.stringify(ingredientsArray));
    if (canEdit("allergens")) formData.append("allergens", JSON.stringify(allergensArray));
    if (image && canEdit("file")) formData.append("file", image);

    try {
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
        alert(`Błąd uprawnień: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-8 md:p-12">
          <header className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                {initialData ? "Edycja Receptury" : "Nowa Receptura"}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                 <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded-full tracking-widest">
                    Role: {userRole}
                 </span>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {initialData ? `ID: #${initialData.id}` : "Nowy wpis w bazie HQ"}
                 </p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-colors text-3xl font-bold">×</button>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PODSTAWY */}
            <div className="grid gap-4">
               <input
                 type="text" placeholder="NAZWA DANIA"
                 disabled={isFieldDisabled("title")}
                 className={`w-full p-5 rounded-2xl border outline-none font-black uppercase transition-all ${isFieldDisabled("title") ? disabledStyles : enabledStyles}`}
                 value={title} onChange={(e) => setTitle(e.target.value)} required
               />
               <textarea
                 placeholder="OPIS RECEPTURY"
                 disabled={isFieldDisabled("description")}
                 className={`w-full p-5 rounded-2xl border outline-none font-medium min-h-[80px] transition-all ${isFieldDisabled("description") ? disabledStyles : enabledStyles}`}
                 value={description} onChange={(e) => setDescription(e.target.value)}
               />
            </div>

            {/* DANE TECHNICZNE */}
            <div className="grid grid-cols-3 gap-4">
              <div className={`${isFieldDisabled("cooking_time") ? "bg-slate-100" : "bg-slate-50"} p-4 rounded-2xl transition-colors`}>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Czas (min)</label>
                <input type="number" disabled={isFieldDisabled("cooking_time")}
                       className="w-full bg-transparent font-black text-slate-700 outline-none disabled:text-slate-400"
                       value={cookingTime} onChange={(e) => setCookingTime(Number(e.target.value))} />
              </div>
              <div className={`${isFieldDisabled("difficulty") ? "bg-slate-100" : "bg-slate-50"} p-4 rounded-2xl transition-colors`}>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Trudność</label>
                <select disabled={isFieldDisabled("difficulty")}
                        className="w-full bg-transparent font-black text-orange-600 outline-none appearance-none cursor-pointer disabled:text-slate-400"
                        value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="Easy">EASY</option>
                  <option value="Medium">MEDIUM</option>
                  <option value="Hard">HARD</option>
                </select>
              </div>
              <div className={`${isFieldDisabled("kcal") ? "bg-slate-100" : "bg-slate-50"} p-4 rounded-2xl transition-colors border-2 ${isFieldDisabled("kcal") ? "border-transparent" : "border-orange-100"}`}>
                <label className="text-[9px] font-black text-orange-400 uppercase block mb-1 italic">Kalorie</label>
                <input type="number" disabled={isFieldDisabled("kcal")}
                       className="w-full bg-transparent font-black text-slate-700 outline-none disabled:text-slate-400"
                       value={kcal} onChange={(e) => setKcal(Number(e.target.value))} />
              </div>
            </div>

            {/* SKŁADNIKI I ALERGENY */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`${isFieldDisabled("ingredients") ? "bg-slate-100 opacity-60" : "bg-orange-50/50 border-orange-100"} p-6 rounded-3xl border transition-all`}>
                <label className="text-[10px] font-black text-orange-600 uppercase block mb-2 italic">Składniki</label>
                <textarea
                  disabled={isFieldDisabled("ingredients")}
                  placeholder="Składniki..."
                  className="w-full bg-white p-3 rounded-xl border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                  rows={3} value={ingredients} onChange={(e) => setIngredients(e.target.value)}
                />
              </div>
              <div className={`${isFieldDisabled("allergens") ? "bg-slate-100 opacity-60" : "bg-red-50/50 border-red-100"} p-6 rounded-3xl border transition-all`}>
                <label className="text-[10px] font-black text-red-600 uppercase block mb-2 italic">Alergeny</label>
                <textarea
                  disabled={isFieldDisabled("allergens")}
                  placeholder="Alergeny..."
                  className="w-full bg-white p-3 rounded-xl border-none text-sm font-semibold outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-50 disabled:text-slate-400"
                  rows={3} value={allergens} onChange={(e) => setAllergens(e.target.value)}
                />
              </div>
            </div>

            {/* ZDJĘCIE */}
            <div className={`${isFieldDisabled("file") ? "bg-slate-800" : "bg-slate-900"} p-6 rounded-3xl text-white transition-colors`}>
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-3 tracking-widest">
                {isFieldDisabled("file") ? "Brak uprawnień do zdjęć" : (initialData ? "Zmień zdjęcie (S3)" : "Multimedia (S3 Storage)")}
              </label>
              <input
                type="file" accept="image/*"
                disabled={isFieldDisabled("file")}
                onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-orange-500 file:text-white hover:file:bg-white hover:file:text-black transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              />
            </div>

            {userRole !== "viewer" ? (
              <button
                disabled={isUploading}
                className="w-full bg-black text-white p-6 rounded-3xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 shadow-xl"
              >
                {isUploading ? "Przetwarzanie..." : (initialData ? "Zaktualizuj Recepturę" : "Dodaj do Bazy HQ")}
              </button>
            ) : (
              <div className="text-center p-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-400 tracking-widest">
                 Tryb tylko do odczytu (VIEWER)
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}