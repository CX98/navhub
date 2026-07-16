import { LayoutGrid, FolderIcon } from "lucide-react";
import type { Folder } from "@/types";

interface FolderSidebarProps {
  folders: Folder[];
  activeFolderId: number | null;
  folderSiteCounts: Record<number, number>;
  totalCount: number;
  onFolderSelect: (id: number | null) => void;
}

export function FolderSidebar({
  folders,
  activeFolderId,
  folderSiteCounts,
  totalCount,
  onFolderSelect,
}: FolderSidebarProps) {
  return (
    <div className="glass-sidebar flex flex-col rounded-2xl p-3">
      {/* All folders button */}
      <button
        onClick={() => onFolderSelect(null)}
        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          activeFolderId === null
            ? "bg-white/60 text-indigo-600 shadow-sm"
            : "text-gray-600 hover:text-gray-800 hover:bg-white/40"
        }`}
      >
        <LayoutGrid className="size-4" />
        <span>全部</span>
        <span className="ml-auto rounded-full bg-black/5 px-1.5 py-0.5 text-xs">
          {totalCount}
        </span>
      </button>

      {/* Divider */}
      <div className="my-2 h-px bg-white/40" />

      {/* Folder list */}
      <div className="flex flex-col gap-1">
        {folders.map((folder) => {
          const count = folderSiteCounts[folder.id] || 0;
          const isActive = activeFolderId === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => onFolderSelect(isActive ? null : folder.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-white/40"
              }`}
              style={isActive ? { background: "rgba(255,255,255,0.6)", color: folder.color } : {}}
            >
              <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
              <FolderIcon className="size-3.5 shrink-0" style={{ color: folder.color }} />
              <span className="truncate">{folder.name}</span>
              <span className="ml-auto rounded-full bg-black/5 px-1.5 py-0.5 text-xs shrink-0">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
