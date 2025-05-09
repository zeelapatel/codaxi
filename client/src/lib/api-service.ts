import { apiRequest } from "./queryClient";
import { ProjectAnalysis } from "@/types";

export async function analyzeGitHubRepo(repositoryUrl: string, branch: string, language: string): Promise<ProjectAnalysis> {
  const response = await apiRequest("POST", "/api/projects/analyze/github", {
    repositoryUrl,
    branch,
    language
  });
  
  return response.json();
}

export async function analyzeZipFile(formData: FormData): Promise<ProjectAnalysis> {
  // For file uploads, we need to make a direct fetch call since apiRequest
  // would add JSON content type headers which break multipart/form-data
  const response = await fetch("/api/projects/analyze/zip", {
    method: "POST",
    body: formData,
    credentials: "include"
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function getProject(id: string): Promise<ProjectAnalysis> {
  const response = await apiRequest("GET", `/api/projects/${id}`);
  return response.json();
}

export async function getProjectGraph(id: string): Promise<any> {
  const response = await apiRequest("GET", `/api/projects/${id}/graph`);
  return response.json();
}

export async function getProjectDocumentation(id: string): Promise<any> {
  const response = await apiRequest("GET", `/api/projects/${id}/documentation`);
  return response.json();
}

export async function downloadDocumentation(id: string, format: string): Promise<Blob> {
  const response = await apiRequest("GET", `/api/projects/${id}/download?format=${format}`);
  return response.blob();
}
