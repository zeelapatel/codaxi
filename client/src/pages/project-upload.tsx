import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/context/project-context";
import { apiRequest } from "@/lib/queryClient";

interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  url: string;
  defaultBranch: string;
  private: boolean;
  updatedAt: string;
}

const ProjectUpload: React.FC = () => {
  const [isGitHubTab, setIsGitHubTab] = useState(true);
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [language, setLanguage] = useState("nodejs");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { dispatch } = useProject();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  // Fetch repositories when component mounts
  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setIsLoadingRepos(true);
        const response = await apiRequest('GET', '/api/github/repositories');
        if (response.ok) {
          const repos = await response.json();
          setRepositories(repos);
        }
      } catch (error) {
        console.error('Failed to fetch repositories:', error);
      } finally {
        setIsLoadingRepos(false);
      }
    };

    fetchRepositories();
  }, []);

  const handleGitHubTabClick = () => {
    setIsGitHubTab(true);
  };

  const handleZipTabClick = () => {
    setIsGitHubTab(false);
  };

  const handleConnectGitHub = async () => {
    try {
      const response = await apiRequest('GET', '/api/github/authorize');
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      }
    } catch (error) {
      toast({
        title: "GitHub Connection Failed",
        description: "Could not connect to GitHub. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/zip") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a ZIP file",
        variant: "destructive"
      });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/zip") {
      setFile(droppedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a ZIP file",
        variant: "destructive"
      });
    }
  };

  const validateGitHubUrl = (url: string) => {
    // Simple GitHub URL validation
    const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w-]+(\/?|\.git)$/;
    return githubRegex.test(url);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isGitHubTab) {
      if (!validateGitHubUrl(repoUrl)) {
        toast({
          title: "Invalid repository URL",
          description: "Please enter a valid GitHub repository URL",
          variant: "destructive"
        });
        return;
      }

      try {
        setIsUploading(true);
        dispatch({ type: 'START_ANALYSIS', payload: { repositoryUrl: repoUrl, language } });

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = prev + 5;
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return newProgress;
          });
        }, 300);

        const response = await apiRequest('POST', '/api/projects/analyze/github', {
          repositoryUrl: repoUrl,
          branch,
          language
        });

        if (response.ok) {
          const result = await response.json();
          clearInterval(progressInterval);
          dispatch({ type: 'ANALYSIS_COMPLETE', payload: result });
          setLocation(`/analysis/${result.id}`);
        }
      } catch (error) {
        dispatch({ type: 'ANALYSIS_ERROR', payload: error instanceof Error ? error.message : 'Failed to analyze repository' });
        toast({
          title: "Analysis failed",
          description: error instanceof Error ? error.message : 'Failed to analyze repository',
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else {
      if (!file) {
        toast({
          title: "No file selected",
          description: "Please upload a ZIP file",
          variant: "destructive"
        });
        return;
      }

      try {
        setIsUploading(true);
        dispatch({ type: 'START_ANALYSIS', payload: { zipFile: file, language } });

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', language);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = prev + 5;
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return newProgress;
          });
        }, 300);

        // In a real implementation, we would use fetch with 'Content-Type': 'multipart/form-data'
        // For now, simulate a successful response
        setTimeout(() => {
          clearInterval(progressInterval);
          dispatch({
            type: 'ANALYSIS_COMPLETE',
            payload: {
              id: 'zip-' + Date.now(),
              name: file.name.replace('.zip', ''),
              language,
              fileCount: 64,
              totalLines: 9842,
              stats: {
                jsFiles: 48,
                jsonFiles: 10,
                mdFiles: 6
              },
              analysisDate: new Date().toISOString()
            }
          });
          setLocation(`/analysis/zip-${Date.now()}`);
        }, 3000);
      } catch (error) {
        dispatch({ type: 'ANALYSIS_ERROR', payload: error instanceof Error ? error.message : 'Failed to analyze ZIP file' });
        toast({
          title: "Analysis failed",
          description: error instanceof Error ? error.message : 'Failed to analyze ZIP file',
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleRepoSelect = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setRepoUrl(repo.url);
    setBranch(repo.defaultBranch);
  };

  return (
    <section className="py-12 bg-[#121212] fade-in">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-light text-white mb-8">Start a New Project</h1>

        <div className="bg-[#1e1e1e] rounded-xl shadow-md overflow-hidden">
          {/* Upload Tabs */}
          <div className="flex border-b border-[#333333]">
            <div
              className={`px-6 py-4 font-medium flex items-center cursor-pointer ${isGitHubTab ? 'github-tab active text-white' : 'github-tab text-gray-400'}`}
              onClick={handleGitHubTabClick}
            >
              <span className="material-icons mr-2">code</span>
              GitHub Repository
            </div>
            <button 
              className="ml-auto px-6 py-4 text-[#f50057] hover:text-[#ff1f6d] transition-colors flex items-center"
              onClick={handleConnectGitHub}
            >
              <span className="material-icons mr-2">link</span>
              Connect GitHub
            </button>
            <div
              className={`px-6 py-4 font-medium flex items-center cursor-pointer ${!isGitHubTab ? 'zip-tab active text-white' : 'zip-tab text-gray-400'}`}
              onClick={handleZipTabClick}
            >
              <span className="material-icons mr-2">folder_zip</span>
              ZIP Upload
            </div>
          </div>

          {/* GitHub Repository Form */}
          {isGitHubTab ? (
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {repositories.length > 0 ? (
                  <div className="mb-6">
                    <label className="block text-gray-300 mb-2">Select Repository</label>
                    <div className="grid gap-4">
                      {repositories.map(repo => (
                        <div
                          key={repo.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedRepo?.id === repo.id
                              ? 'border-[#f50057] bg-[#2d2d2d]'
                              : 'border-[#333333] hover:border-[#f50057]'
                          }`}
                          onClick={() => handleRepoSelect(repo)}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-white font-medium">{repo.name}</h3>
                            {repo.private && (
                              <span className="text-xs bg-[#333333] text-gray-300 px-2 py-1 rounded">Private</span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-gray-400 text-sm mt-1">{repo.description}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            Default branch: {repo.defaultBranch}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <label className="block text-gray-300 mb-2" htmlFor="repoUrl">Repository URL</label>
                    <Input
                      id="repoUrl"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/username/repository"
                      className="w-full bg-[#2d2d2d] border border-[#333333] rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-300 mb-2" htmlFor="branch">Branch</label>
                    <Select value={branch} onValueChange={setBranch}>
                      <SelectTrigger
                        id="branch"
                        className="w-full bg-[#2d2d2d] border border-[#333333] rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                      >
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">main</SelectItem>
                        <SelectItem value="master">master</SelectItem>
                        <SelectItem value="develop">develop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2" htmlFor="language">Language</label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger
                        id="language"
                        className="w-full bg-[#2d2d2d] border border-[#333333] rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                      >
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nodejs">Node.js</SelectItem>
                        <SelectItem value="react" disabled>React (Coming Soon)</SelectItem>
                        <SelectItem value="python" disabled>Python (Coming Soon)</SelectItem>
                        <SelectItem value="java" disabled>Java (Coming Soon)</SelectItem>
                        <SelectItem value="c" disabled>C/C++ (Coming Soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mb-6">
                  <label htmlFor="projectDescription" className="block text-gray-300 mb-2">
                    Write a short description of your project for AI:
                  </label>
                  <textarea
                    id="projectDescription"
                    className="w-full bg-[#2d2d2d] border border-[#333333] rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="Enter a brief description of your project..."
                    rows={4}
                    required
                  />
                </div>
                {isUploading && (
                  <div className="mb-4">
                    <div className="h-1 w-full bg-[#2d2d2d] rounded-full">
                      <div
                        className="h-1 bg-[#f50057] rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-400 mt-2">Analyzing repository... {uploadProgress}%</p>
                  </div>
                )}

                <div className="flex justify-end">

                  <Button
                    type="submit"
                    className="bg-[#f50057] text-white px-6 py-3 rounded-md font-medium hover:bg-opacity-90 transition-colors flex items-center"
                    disabled={isUploading}
                  >
                    <span className="material-icons mr-2">rocket_launch</span>
                    Start Analysis
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6">
              <div
                className="border-2 border-dashed border-[#333333] rounded-xl p-4 text-center cursor-pointer h-32 flex flex-col justify-center items-center"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <span className="material-icons text-3xl text-gray-400 mb-2">upload_file</span>
                <h3 className="text-lg font-medium text-white mb-1">Drag & Drop Your Project ZIP</h3>
                <p className="text-sm text-gray-300">Or click to browse your files</p>
                <input
                  type="file"
                  id="fileUpload"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".zip"
                  onChange={handleFileChange}
                />
              </div>
              {file && (
                <div className="mt-4 p-4 bg-[#2d2d2d] rounded-lg">
                  <div className="flex items-center">
                    <span className="material-icons text-[#4caf50] mr-2">check_circle</span>
                    <span className="text-white">{file.name}</span>
                    <span className="ml-2 text-sm text-gray-400">({Math.round(file.size / 1024)} KB)</span>
                    <button
                      className="ml-auto text-gray-400 hover:text-white"
                      onClick={() => setFile(null)}
                    >
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="mt-4">
                  <div className="h-1 w-full bg-[#2d2d2d] rounded-full">
                    <div
                      className="h-1 bg-[#f50057] rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Uploading and analyzing... {uploadProgress}%</p>
                </div>
              )}
              <div className="mb-6 my-2">
                <label htmlFor="projectDescription" className="block text-gray-300 mb-2">
                  Write a short description of your project for AI:
                </label>
                <textarea
                  id="projectDescription"
                  className="w-full bg-[#2d2d2d] border border-[#333333] rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="Enter a brief description of your project..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end mt-6">
                <label className="mr-4">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger
                      id="language-zip"
                      className="w-60 bg-[#2d2d2d] border border-[#333333] rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                    >
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nodejs">Node.js</SelectItem>
                      <SelectItem value="react" disabled>React (Coming Soon)</SelectItem>
                      <SelectItem value="python" disabled>Python (Coming Soon)</SelectItem>
                      <SelectItem value="java" disabled>Java (Coming Soon)</SelectItem>
                      <SelectItem value="c" disabled>C/C++ (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </label>

                <Button
                  onClick={handleSubmit}
                  className="bg-[#f50057] text-white px-6 py-3 rounded-md font-medium hover:bg-opacity-90 transition-colors flex items-center"
                  disabled={!file || isUploading}
                >
                  <span className="material-icons mr-2">rocket_launch</span>
                  Start Analysis
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default ProjectUpload;
