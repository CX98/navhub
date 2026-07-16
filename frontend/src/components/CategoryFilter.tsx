import { LayoutGrid, FolderIcon, TagIcon, Settings2 } from "lucide-react";
import type { Folder, Tag } from "@/types";

interface CategoryFilterProps {
  filterMode: "folder" | "tag";
  folders: Folder[];
  tags: Tag[];
  activeFolderId: number | null;
  activeTagId: number | null;
  folderSiteCounts: Record<number, number>;
  tagSiteCounts: Record<number, number>;
  totalCount: number;
  onModeChange: (mode: "folder" | "tag") => void;
  onFolderSelect: (id: number | null) => void;
  onTagSelect: (id: number | null) => void;
  onManageClick: () => void;
  isAuth: boolean;
}

export function CategoryFilter({
  filterMode,
  folders,
  tags,
  activeFolderId,
  activeTagId,
  folderSiteCounts,
  tagSiteCounts,
  totalCount,
  onModeChange,
  onFolderSelect,
  onTagSelect,
  onManageClick,
  isAuth,
}: CategoryFilterProps) {
  const items = filterMode === "folder" ? folders : tags;
  const activeId = filterMode === "folder" ? activeFolderId : activeTagId;
  const counts = filterMode === "folder" ? folderSiteCounts : tagSiteCounts;
  const onSelect = filterMode === "folder" ? onFolderSelect : onTagSelect;

  return (
    <div className="space-y-3">
      {/* Mode toggle + manage button */}
      <div className="flex items-center justify-between">
        <div className="glass flex items-center rounded-xl p-1">
          <button
            onClick={() => onModeChange("folder")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              filterMode === "folder"
                ? "bg-white/60 text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FolderIcon className="size-3.5" />
            文件夹
          </button>
          <button
            onClick={() => onModeChange("tag")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              filterMode === "tag"
                ? "bg-white/60 text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <TagIcon className="size-3.5" />
            标签
          </button>
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

      {/* Filter items */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSelect(null)}
          className={`glass-tag flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            activeId === null ? "glass-tag-active text-indigo-600" : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <LayoutGrid className="size-4" />
          全部
          <span className="ml-0.5 rounded-full bg-black/5 px-1.5 py-0.5 text-xs">
            {totalCount}
          </span>
        </button>

        {items.map((item) => {
          const count = counts[item.id] || 0;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(isActive ? null : item.id)}
              className={`glass-tag flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive ? "glass-tag-active" : "text-gray-600 hover:text-gray-800"
              }`}
              style={isActive ? { color: item.color } : {}}
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
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
