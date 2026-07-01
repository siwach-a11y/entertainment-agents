"use client";

interface CategoryChipsProps {
  categories: readonly string[];
  active: string;
  onChange: (category: string) => void;
}

export default function CategoryChips({
  categories,
  active,
  onChange,
}: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`chip ${active === cat ? "chip-active" : "chip-inactive"}`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
