'use client';

export default function RecipeImage({ src, alt }: { src: string | null, alt: string }) {
  if (!src) return <div className="w-full h-full bg-gray-200" />;

  // Ta linia naprawia adresy z bazy, żeby przeglądarka je rozumiała
  const safeSrc = src.replace("recipe_hq_aws", "localhost");

  return (
    <img
      src={safeSrc}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => {
        // Jeśli nadal jest błąd, wypisz go w konsoli F12
        console.error("Nie udało się załadować:", safeSrc);
      }}
    />
  );
}