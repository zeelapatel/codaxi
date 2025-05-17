import React, { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageBadge from "@/components/shared/language-badge";
import AnalysisTabs from "@/components/shared/analysis-tabs";
import DependencyGraph from "@/components/visualization/dependency-graph";

interface Project {
  id: string | number;
  language: string;
  name: string;
  summary: {
    overview: string;
    architecture: string;
    testingApproach: string;
    codeQuality: string;
  };
}

interface GraphData {
  nodes: Array<{
    id: string;
    name: string;
    group: number;
    radius: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;
  }>;
}

const RelationshipVisualization: React.FC = () => {
  const { id } = useParams();
  const [viewType, setViewType] = useState<string>("force");
  const [detailLevel, setDetailLevel] = useState<number[]>([3]);
  const [focusFile, setFocusFile] = useState<string>("");
  const [fileTypes, setFileTypes] = useState({
    jsFiles: true,
    jsonFiles: true,
    configFiles: true,
    testFiles: false
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fetch project data
  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`/api/projects/${id}`],
    enabled: !!id
  });
  
  // Fetch graph data
  const { data: graphData, isLoading: isLoadingGraph } = useQuery<GraphData>({
    queryKey: [`/api/projects/${id}/graph`],
    enabled: !!id
  });

  const handleFileTypeChange = (key: keyof typeof fileTypes) => {
    setFileTypes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Filter graph data based on file types and detail level
  const filteredGraphData = React.useMemo(() => {
    if (!graphData) return null;

    let filtered = { ...graphData };

    // Filter nodes based on file types
    filtered.nodes = graphData.nodes.filter(node => {
      const fileName = node.name.toLowerCase();
      if (!fileTypes.jsFiles && (fileName.endsWith('.js') || fileName.endsWith('.jsx') || fileName.endsWith('.ts') || fileName.endsWith('.tsx'))) return false;
      if (!fileTypes.jsonFiles && fileName.endsWith('.json')) return false;
      if (!fileTypes.configFiles && (fileName.includes('config') || fileName.includes('.env'))) return false;
      if (!fileTypes.testFiles && (fileName.includes('.test.') || fileName.includes('.spec.'))) return false;
      return true;
    });

    // Filter links to only include connections between remaining nodes
    const nodeIds = new Set(filtered.nodes.map(n => n.id));
    filtered.links = graphData.links.filter(link => 
      nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    // Filter based on focus file if specified
    if (focusFile) {
      const focusedNodeIds = new Set([
        ...filtered.nodes
          .filter(n => n.name.toLowerCase().includes(focusFile.toLowerCase()))
          .map(n => n.id),
      ]);

      // Add directly connected nodes
      filtered.links.forEach(link => {
        if (focusedNodeIds.has(link.source)) focusedNodeIds.add(link.target);
        if (focusedNodeIds.has(link.target)) focusedNodeIds.add(link.source);
      });

      filtered.nodes = filtered.nodes.filter(n => focusedNodeIds.has(n.id));
      filtered.links = filtered.links.filter(l => 
        focusedNodeIds.has(l.source) && focusedNodeIds.has(l.target)
      );
    }

    return filtered;
  }, [graphData, fileTypes, focusFile]);

  // Get most connected files
  const mostConnectedFiles = React.useMemo(() => {
    if (!graphData) return [];
    
    const connections = new Map<string, number>();
    graphData.links.forEach(link => {
      connections.set(link.source, (connections.get(link.source) || 0) + 1);
      connections.set(link.target, (connections.get(link.target) || 0) + 1);
    });

    return Array.from(connections.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([file, count]) => ({ file, connections: count }));
  }, [graphData]);

  if (isLoadingProject || isLoadingGraph) {
    return (
      <section className="py-12 bg-[#121212]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          <Skeleton className="h-14 mb-8 rounded-xl" />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 lg:col-span-3 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-[#121212] fade-in">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-light text-white">Relationship Visualization</h1>
          <div className="text-gray-300 flex items-center">
            <LanguageBadge language={project?.language || "unknown"} />
          </div>
        </div>
        
        <AnalysisTabs projectId={id || ""} activeTab="relationships" />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Visualization Controls */}
          <div className="bg-[#1e1e1e] rounded-xl shadow-md p-6">
            <h2 className="text-xl font-medium text-white mb-4">Visualization Controls</h2>
            
            <div className="space-y-4">
                
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="viewType">View Type</label>
                <Select value={viewType} onValueChange={setViewType}>
                  <SelectTrigger 
                    id="viewType" 
                    className="w-full bg-[#2d2d2d] border border-[#333333] rounded-md px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                  >
                    <SelectValue placeholder="Select view type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="force">Force Directed</SelectItem>
                    <SelectItem value="tree">Tree View</SelectItem>
                    <SelectItem value="circular">Circular Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="detailLevel">Detail Level</label>
                <Slider 
                  id="detailLevel" 
                  min={1} 
                  max={5} 
                  step={1} 
                  value={detailLevel}
                  onValueChange={setDetailLevel}
                  className="w-full" 
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Simple</span>
                  <span>Detailed</span>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="focusFile">Focus on File</label>
                <Input
                  id="focusFile"
                  value={focusFile}
                  onChange={(e) => setFocusFile(e.target.value)}
                  className="w-full bg-[#2d2d2d] border border-[#333333] rounded-md px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="Start typing to search..."
                />
              </div>
              
              <div className="pt-2">
                <h3 className="text-white font-medium mb-2">Filter By Type</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="jsFiles" 
                      checked={fileTypes.jsFiles} 
                      onCheckedChange={() => handleFileTypeChange('jsFiles')}
                    />
                    <label htmlFor="jsFiles" className="text-gray-300 cursor-pointer">JavaScript/TypeScript Files</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="jsonFiles" 
                      checked={fileTypes.jsonFiles} 
                      onCheckedChange={() => handleFileTypeChange('jsonFiles')}
                    />
                    <label htmlFor="jsonFiles" className="text-gray-300 cursor-pointer">JSON Files</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="configFiles" 
                      checked={fileTypes.configFiles} 
                      onCheckedChange={() => handleFileTypeChange('configFiles')}
                    />
                    <label htmlFor="configFiles" className="text-gray-300 cursor-pointer">Config Files</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="testFiles" 
                      checked={fileTypes.testFiles} 
                      onCheckedChange={() => handleFileTypeChange('testFiles')}
                    />
                    <label htmlFor="testFiles" className="text-gray-300 cursor-pointer">Test Files</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Graph Visualization */}
          <div className={`${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-[#121212]' : 'lg:col-span-3'} bg-[#1e1e1e] rounded-xl shadow-md p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-white">Dependency Graph</h2>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleFullscreen}
                  className="p-2 bg-[#2d2d2d] rounded-md hover:bg-opacity-80 transition-colors"
                >
                  <span className="material-icons text-white">
                    {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                  </span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="p-2 bg-[#2d2d2d] rounded-md hover:bg-opacity-80 transition-colors"
                >
                  <span className="material-icons text-white">download</span>
                </Button>
              </div>
            </div>
            
            {/* Graph Visualization */}
            <div className={`w-full ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-96'} bg-[#2d2d2d] rounded-xl relative overflow-hidden`}>
              {isLoadingGraph ? (
                <div className="flex items-center justify-center h-full">
                  <div className="progress-indicator w-32" />
                </div>
              ) : graphData ? (
                <DependencyGraph 
                  data={graphData} 
                  width={800} 
                  height={400}
                  viewType={viewType as "force" | "tree" | "circular"}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No graph data available
                </div>
              )}
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Most Connected Files */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Most Connected Files</h3>
                <ul className="space-y-2">
                  {graphData && graphData.nodes.length > 0 && mostConnectedFiles.slice(0, 3).map(({ file, connections }) => (
                    <li key={file} className="flex items-center text-gray-300">
                      <span className="material-icons text-[#f50057] mr-2">hub</span>
                      <span className="font-mono text-sm truncate" title={file}>{file.split('/').pop()}</span>
                      <span className="ml-auto text-white font-medium">{connections} connections</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Potential Issues */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Potential Issues</h3>
                <ul className="space-y-2">
                  {graphData && graphData.nodes.length > 0 && (
                    <>
                      {graphData.nodes.filter(node => 
                        graphData.links.filter(link => 
                          link.source === node.id || link.target === node.id
                        ).length > 10
                      ).map(node => (
                        <li key={node.id} className="flex items-center text-gray-300">
                          <span className="material-icons text-[#ff9800] mr-2">warning</span>
                          <span className="text-sm">High coupling in <code className="font-mono">{node.name}</code></span>
                        </li>
                      ))}
                      {graphData.nodes.filter(node => 
                        !graphData.links.some(link => 
                          link.source === node.id || link.target === node.id
                        )
                      ).map(node => (
                        <li key={node.id} className="flex items-center text-gray-300">
                          <span className="material-icons text-[#ff9800] mr-2">warning</span>
                          <span className="text-sm">Isolated file: <code className="font-mono">{node.name}</code></span>
                        </li>
                      ))}
                      {graphData.links.filter(link => 
                        graphData.links.some(otherLink => 
                          otherLink.source === link.target && otherLink.target === link.source
                        )
                      ).slice(0, 3).map(link => (
                        <li key={`${link.source}-${link.target}`} className="flex items-center text-gray-300">
                          <span className="material-icons text-[#ff9800] mr-2">warning</span>
                          <span className="text-sm">Circular dependency between <code className="font-mono">{link.source}</code> and <code className="font-mono">{link.target}</code></span>
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RelationshipVisualization;
