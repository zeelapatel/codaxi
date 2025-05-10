import React from "react";
import { Link, useLocation } from "wouter";

type AnalysisTabsProps = {
  projectId: string;
  activeTab: "overview" | "relationships" | "documentation" | "download";
};

const AnalysisTabs: React.FC<AnalysisTabsProps> = ({ projectId, activeTab }) => {
  return (
    <div className="bg-[#1e1e1e] rounded-xl shadow-md overflow-hidden mb-8">
      <div className="flex border-b border-[#333333] overflow-x-auto">
        <Link href={`/analysis/${projectId}`}>
          <a className={`px-6 py-4 font-medium flex items-center border-b-2 transition-colors hover:bg-[#252525] ${
            activeTab === "overview" 
              ? "text-white border-[#f50057]" 
              : "text-gray-400 border-transparent hover:text-gray-200"
          }`}>
            <span className="material-icons text-lg mr-2">dashboard</span>
            Overview
          </a>
        </Link>
        <Link href={`/visualization/${projectId}`}>
          <a className={`px-6 py-4 font-medium flex items-center border-b-2 transition-colors hover:bg-[#252525] ${
            activeTab === "relationships" 
              ? "text-white border-[#f50057]" 
              : "text-gray-400 border-transparent hover:text-gray-200"
          }`}>
            <span className="material-icons text-lg mr-2">device_hub</span>
            Relationships
          </a>
        </Link>
        <Link href={`/documentation/${projectId}`}>
          <a className={`px-6 py-4 font-medium flex items-center border-b-2 transition-colors hover:bg-[#252525] ${
            activeTab === "documentation" 
              ? "text-white border-[#f50057]" 
              : "text-gray-400 border-transparent hover:text-gray-200"
          }`}>
            <span className="material-icons text-lg mr-2">article</span>
            Documentation
          </a>
        </Link>
        <Link href={`/download/${projectId}`}>
          <a className={`px-6 py-4 font-medium flex items-center border-b-2 transition-colors hover:bg-[#252525] ${
            activeTab === "download" 
              ? "text-white border-[#f50057]" 
              : "text-gray-400 border-transparent hover:text-gray-200"
          }`}>
            <span className="material-icons text-lg mr-2">download</span>
            Download
          </a>
        </Link>
      </div>
    </div>
  );
};

export default AnalysisTabs;