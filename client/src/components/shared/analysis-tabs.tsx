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
          <a className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === "overview" ? "text-white border-[#f50057]" : "text-gray-400 border-transparent"}`}>
            Overview
          </a>
        </Link>
        <Link href={`/visualization/${projectId}`}>
          <a className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === "relationships" ? "text-white border-[#f50057]" : "text-gray-400 border-transparent"}`}>
            Relationships
          </a>
        </Link>
        <Link href={`/documentation/${projectId}`}>
          <a className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === "documentation" ? "text-white border-[#f50057]" : "text-gray-400 border-transparent"}`}>
            Documentation
          </a>
        </Link>
        <Link href={`/download/${projectId}`}>
          <a className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === "download" ? "text-white border-[#f50057]" : "text-gray-400 border-transparent"}`}>
            Download
          </a>
        </Link>
      </div>
    </div>
  );
};

export default AnalysisTabs;
