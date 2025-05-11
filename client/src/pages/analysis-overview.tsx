import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageBadge from "@/components/shared/language-badge";
import AnalysisTabs from "@/components/shared/analysis-tabs";
import { useProject } from "@/context/project-context";

const AnalysisOverview: React.FC = () => {
  const { id } = useParams();
  const { state } = useProject();
  
  // For real implementation, fetch project data from API
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${id}`],
    // If we have the project in context, use it
    initialData: state.currentProject?.id === id ? state.currentProject : undefined
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-[#121212]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          <Skeleton className="h-14 mb-8 rounded-xl" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="py-12 bg-[#121212]">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="pt-6">
              <h1 className="text-2xl font-bold text-red-500">Project not found</h1>
              <p className="mt-2">The requested project could not be found or has been deleted.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-[#121212] fade-in">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-light text-white">Project Analysis</h1>
          <div className="text-gray-300 flex items-center">
            <LanguageBadge language={project.language || "nodejs"} />
          </div>
        </div>
        
        <AnalysisTabs projectId={id || ''} activeTab="overview" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Stats */}
          <div className="bg-[#1e1e1e] rounded-xl shadow-md p-6">
            <h2 className="text-xl font-medium text-white mb-4">Project Statistics</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#333333]">
                <span className="text-gray-300">Total Files</span>
                <span className="text-white font-medium">{project.file_count || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#333333]">
                <span className="text-gray-300">JavaScript Files</span>
                <span className="text-white font-medium">{project.stats?.jsFiles || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#333333]">
                <span className="text-gray-300">JSON Files</span>
                <span className="text-white font-medium">{project.stats?.jsonFiles || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#333333]">
                <span className="text-gray-300">Markdown Files</span>
                <span className="text-white font-medium">{project.stats?.mdFiles || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#333333]">
                <span className="text-gray-300">Total Lines of Code</span>
                <span className="text-white font-medium">{(project.total_lines || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Analysis Date</span>
                <span className="text-white font-medium">
                  {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Not analyzed yet'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Project Summary */}
          <div className="lg:col-span-2 bg-[#1e1e1e] rounded-xl shadow-md p-6">
            <h2 className="text-xl font-medium text-white mb-4">AI-Generated Summary</h2>
            
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-gray-300">
                This is a Node.js API backend project using Express.js for routing and MongoDB as the database. The project follows a Model-View-Controller (MVC) architecture with clearly separated concerns. Authentication is implemented using JWT tokens, and the API endpoints are RESTful.
              </p>
              <p className="text-gray-300 mt-4">
                The core functionality is divided across several modules, with the main entry point being <code>app.js</code>. Configuration is managed through environment variables using dotenv. The project includes comprehensive error handling and validation using Joi schema validation.
              </p>
              <p className="text-gray-300 mt-4">
                Test coverage is approximately 65%, primarily with Jest unit tests. The project uses ESLint for code quality and follows the Airbnb style guide for consistency.
              </p>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white mb-3">Key Files</h3>
              <ul className="space-y-2">
                {project.main_files.map((file, index) => (
                  <li key={index} className="flex items-center text-gray-300">
                    <span className="material-icons text-[#ec407a] mr-2">
                      {file.path.endsWith('.js') || file.path.endsWith('.ts') ? 'javascript' :
                       file.path.endsWith('.json') ? 'data_object' :
                       file.path.endsWith('.md') ? 'description' : 'insert_drive_file'}
                    </span>
                    <span className="font-mono text-sm">{file.path}</span>
                    <span className="ml-2 text-xs text-gray-400">- {file.description}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white mb-3">Main Dependencies</h3>
              <div className="flex flex-wrap gap-2">
                {project.dependencies.map((dep, index) => (
                  <span key={index} className="px-3 py-1 bg-[#2d2d2d] rounded-full text-sm text-white">
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalysisOverview;
