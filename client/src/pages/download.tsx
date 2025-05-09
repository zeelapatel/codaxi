import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageBadge from "@/components/shared/language-badge";
import AnalysisTabs from "@/components/shared/analysis-tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const DownloadCard: React.FC<{
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  disabled?: boolean;
  comingSoon?: boolean;
  onClick?: () => void;
}> = ({ icon, iconColor, title, description, disabled = false, comingSoon = false, onClick }) => {
  return (
    <div className={`bg-[#1e1e1e] rounded-xl shadow-md overflow-hidden ${comingSoon ? 'opacity-70' : ''}`}>
      <div className="px-6 py-8 flex flex-col items-center relative">
        {comingSoon && (
          <div className="absolute top-3 right-3 bg-[#2196f3] bg-opacity-20 text-[#2196f3] text-xs rounded-full px-2 py-1">
            Coming Soon
          </div>
        )}
        <div className={`w-16 h-16 flex items-center justify-center bg-${iconColor}-100 bg-opacity-10 rounded-full mb-4`}>
          <span className="material-icons text-3xl text-[#6e6e6e]" style={{ color: iconColor }}>
            {icon}
          </span>
        </div>
        <h3 className="text-xl font-medium text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-center mb-6">
          {description}
        </p>
        <Button
          className={`flex items-center ${
            disabled 
              ? 'bg-[#2d2d2d] text-gray-400 cursor-not-allowed' 
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
          onClick={onClick}
          disabled={disabled || comingSoon}
        >
          <span className="material-icons mr-2">download</span>
          {comingSoon ? 'Coming Soon' : 'Download'}
        </Button>
      </div>
    </div>
  );
};

const Download: React.FC = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
  // For real implementation, fetch project data from API
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${id}`]
  });

  const handleDownload = async (format: string) => {
    try {
      const res = await apiRequest('GET', `/api/projects/${id}/download?format=${format}`, undefined);
      
      // Handle file download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `documentation_${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: `Your ${format.toUpperCase()} documentation is downloading.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download documentation",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-[#121212]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          <Skeleton className="h-14 mb-8 rounded-xl" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-[#121212] fade-in">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-light text-white">Download Documentation</h1>
          <div className="text-gray-300 flex items-center">
            <LanguageBadge language={project?.language || "nodejs"} />
          </div>
        </div>
        
        <AnalysisTabs projectId={id} activeTab="download" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Word Format */}
          <DownloadCard
            icon="description"
            iconColor="#4285f4"
            title="Microsoft Word"
            description="Download comprehensive documentation in DOCX format"
            onClick={() => handleDownload('docx')}
          />
          
          {/* PDF Format */}
          <DownloadCard
            icon="picture_as_pdf"
            iconColor="#ea4335"
            title="PDF Document"
            description="Download documentation in high-quality PDF format"
            onClick={() => handleDownload('pdf')}
          />
          
          {/* HTML Format */}
          <DownloadCard
            icon="html"
            iconColor="#fbbc05"
            title="HTML Website"
            description="Download as static HTML site with interactive features"
            onClick={() => handleDownload('html')}
          />
          
          {/* Markdown Files - Coming Soon */}
          <DownloadCard
            icon="format_markdown"
            iconColor="#6e6e6e"
            title="Markdown Files"
            description="Download as GitHub-compatible markdown files"
            comingSoon
          />
          
          {/* JSDoc Format - Coming Soon */}
          <DownloadCard
            icon="integration_instructions"
            iconColor="#6e6e6e"
            title="JSDoc Format"
            description="Download as JSDoc compatible documentation"
            comingSoon
          />
          
          {/* Interactive Report - Coming Soon */}
          <DownloadCard
            icon="smart_button"
            iconColor="#6e6e6e"
            title="Interactive Report"
            description="Interactive web-based report with advanced navigation"
            comingSoon
          />
        </div>
      </div>
    </section>
  );
};

export default Download;
