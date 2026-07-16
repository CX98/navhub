import { ExternalLink, Folder, Tag } from "lucide-react";
import type { Site } from "@/types";

interface SiteCardProps {
  site: Site;
  index: number;
  onClick: () => void;
}

export function SiteCard({ site, index, onClick }: SiteCardProps) {
  const domain = (() => {
    try {
      return new URL(site.url).hostname.replace("www.", "");
    } catch {
      return site.url;
    }
  })();

  const initials = site.title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const siteTags = site.tags || [];

  return (
    <div
      className="glass-card fade-in-up cursor-pointer rounded-2xl p-5 group"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon / Avatar */}
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-md"
          style={{
            background: `linear-gradient(135deg, ${site.folder_color || "#6366f1"}, ${site.folder_color ? site.folder_color + "aa" : "#818cf8"})`,
          }}
        >
          {site.icon ? (
            <img src={site.icon} alt={site.title} className="size-8 rounded-lg" />
          ) : (
            initials
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
              {site.title}
            </h3>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-gray-500 leading-relaxed">
            {site.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {/* Folder badge */}
            {site.folder_name && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: (site.folder_color || "#6366f1") + "20",
                  color: site.folder_color || "#6366f1",
                }}
              >
                <Folder className="size-3" />
                {site.folder_name}
              </span>
            )}
            {/* Tag badges */}
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
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <ExternalLink className="size-3" />
              {domain}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
