export interface Folder {
  id: number;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at?: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  created_at?: string;
}

export interface SiteTag {
  id: number;
  name: string;
  color: string;
}

export interface Site {
  id: number;
  title: string;
  description: string;
  url: string;
  icon: string;
  usage_guide: string;
  folder_id: number | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  folder_name?: string;
  folder_color?: string;
  folder_icon?: string;
  tags?: SiteTag[];
}

export interface Stats {
  sites: number;
  tags: number;
  folders: number;
}
