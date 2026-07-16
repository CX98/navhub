import { LayoutGrid, TagIcon, Settings2 } from "lucide-react";
import type { Tag } from "@/types";

interface TagFilterProps {
  tags: Tag[];
  activeTagId: number | null;
  tagSiteCounts: Record<number, number>;
  totalCount: number;
  onTagSelect: (id: number | null) => void;
  onManageClick: () => void;
  isAuth: boolean;
}

export function TagFilter({
  tags,
  activeTagId,
  tagSiteCounts,
  totalCount,
  onTagSelect,
  onManageClick,
  isAuth,
}: TagFilterProps) {
  return (
    <div className="space-y-3">
      {/* Tag bar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <TagIcon className="size-4 text-indigo-500" />
          <span>标签筛选</span>
        </div>
        {isAuth && (
          <button
            onClick={onManageClick}
            className="glass flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-all"
          >
            <Settings2 className="size-3.5" />
            管理
          </button>
        )}
      </div>

      {/* Tag filter items */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onTagSelect(null)}
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
          const count = tagSiteCounts[tag.id] || 0;
          const isActive = activeTagId === tag.id;
          return (
            <button
              key={tag.id}
              onClick={() => onTagSelect(isActive ? null : tag.id)}
              className={`glass-tag flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive ? "glass-tag-active" : "text-gray-600 hover:text-gray-800"
              }`}
              style={isActive ? { color: tag.color } : {}}
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
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
    </div>
  );
}
