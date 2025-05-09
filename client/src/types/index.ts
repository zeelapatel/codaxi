export type FileType = "js" | "json" | "md" | "config" | "test" | "other";

export interface FileInfo {
  path: string;
  type: FileType;
  size: number;
  lines: number;
}

export interface DependencyLink {
  source: string;
  target: string;
  type: string;
}

export interface ProjectStats {
  jsFiles: number;
  jsonFiles: number;
  mdFiles: number;
  configFiles?: number;
  testFiles?: number;
}

export interface ProjectAnalysis {
  id: string;
  name: string;
  language: string;
  fileCount: number;
  totalLines: number;
  stats: ProjectStats;
  files?: FileInfo[];
  dependencies?: DependencyLink[];
  summary?: string;
  keyFiles?: { path: string; description: string }[];
  mainDependencies?: string[];
  analysisDate: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  content: string;
  sections: DocumentSection[];
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  subsections?: DocumentSection[];
}
