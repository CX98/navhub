import { LayoutGrid } from "lucide-react";
import type { Tag } from "@/types";

interface TagFilterProps {
  tags: Tag[];
  activeTagId: number | null;
  siteCounts: Record<number, number>;
  totalCount: number;
  onSelect: (id: number | null) => void;
}

export function TagFilter({
  tags,
  activeTagId,
  siteCounts,
  totalCount,
  onSelect,
}: TagFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`glass-tag flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
          activeTagId === null ? "glass-tag-active text-indigo-600" : "text-gray-600 hover:text-gray-800"
        }`}
      >
        <LayoutGrid className="size-4" />
        全部
        <span className="ml-0.5 rounded-full bg-black/5 px-1.5 py-0.5 text-xs">
          {totalCount}
        </span>
      </button>

      {tags.map((tag) => {
        const count = siteCounts[tag.id] || 0;
        const isActive = activeTagId === tag.id;
        return (
          <button
            key={tag.id}
            onClick={() => onSelect(isActive ? null : tag.id)}
            className={`glass-tag flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isActive ? "glass-tag-active" : "text-gray-600 hover:text-gray-800"
            }`}
            style={isActive ? { color: tag.color } : {}}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
            {count > 0 && (
              <span className="ml-0.5 rounded-full bg-black/5 px-1.5 py-0.5 text-xs">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
