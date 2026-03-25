'use client';

import { useState } from 'react';

interface RecipeImageProps {
  src: string | null;
  alt: string;
}

export default function RecipeImage({ src, alt }: RecipeImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-100 text-slate-400 p-4 text-center">
        <span className="text-2xl mb-2">📸</span>
        <p className="text-[10px] uppercase font-bold">Błąd dokumentacji foto</p>
        <p className="text-[9px] mt-1 opacity-50">Sprawdź status S3 / LocalStack</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={() => setError(true)}
    />
  );
}