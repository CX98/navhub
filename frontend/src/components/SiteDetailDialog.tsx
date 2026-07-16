import { ExternalLink, Tag, Folder, FileText, BookOpen, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Site } from "@/types";

interface SiteDetailDialogProps {
  site: Site | null;
  open: boolean;
  onClose: () => void;
}

export function SiteDetailDialog({ site, open, onClose }: SiteDetailDialogProps) {
  if (!site) return null;

  const domain = (() => {
    try {
      return new URL(site.url).hostname.replace("www.", "");
    } catch {
      return site.url;
    }
  })();

  const siteTags = site.tags || [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-dialog-content max-w-xl rounded-2xl border-white/60 p-0 overflow-hidden">
        {/* Header banner */}
        <div
          className="relative h-24"
          style={{
            background: `linear-gradient(135deg, ${site.folder_color || "#6366f1"}, ${site.folder_color ? site.folder_color + "88" : "#818cf8"})`,
          }}
        >
          <div className="absolute -bottom-6 left-6 flex items-end gap-3">
            <div
              className="flex size-14 items-center justify-center rounded-2xl border-4 border-white text-xl font-bold text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${site.folder_color || "#6366f1"}, ${site.folder_color ? site.folder_color + "aa" : "#818cf8"})`,
              }}
            >
              {site.title.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("")}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-8">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-xl font-bold text-gray-800">
                {site.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Folder badge */}
                {site.folder_name && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: (site.folder_color || "#6366f1") + "20",
                      color: site.folder_color || "#6366f1",
                    }}
                  >
                    <Folder className="size-3" />
                    {site.folder_name}
                  </span>
                )}
                {/* Tags */}
                {siteTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: tag.color + "20",
                      color: tag.color,
                    }}
                  >
                    <Tag className="size-3" />
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </DialogHeader>

          {/* URL */}
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm transition-all hover:bg-white/70"
          >
            <Globe className="size-4 shrink-0 text-indigo-500" />
            <span className="truncate text-gray-600">{domain}</span>
            <ExternalLink className="ml-auto size-4 shrink-0 text-gray-400" />
          </a>

          {/* Description */}
          {site.description && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <FileText className="size-4 text-indigo-500" />
                网站介绍
              </div>
              <p className="rounded-xl bg-white/40 p-3 text-sm leading-relaxed text-gray-600">
                {site.description}
              </p>
            </div>
          )}

          {/* Usage Guide */}
          {site.usage_guide && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <BookOpen className="size-4 text-indigo-500" />
                使用详情
              </div>
              <p className="whitespace-pre-line rounded-xl bg-white/40 p-3 text-sm leading-relaxed text-gray-600">
                {site.usage_guide}
              </p>
            </div>
          )}

          {/* Visit button */}
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-indigo-600 hover:to-purple-600"
          >
            访问网站
            <ExternalLink className="size-4" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
