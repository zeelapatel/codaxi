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

// Sample graph data
const sampleGraphData = {
  nodes: [
    { id: "app.js", name: "app.js", group: 1, radius: 20 },
    { id: "routes/index.js", name: "routes/index.js", group: 2, radius: 15 },
    { id: "routes/api.js", name: "routes/api.js", group: 2, radius: 15 },
    { id: "routes/users.js", name: "routes/users.js", group: 2, radius: 15 },
    { id: "routes/auth.js", name: "routes/auth.js", group: 2, radius: 15 },
    { id: "config/db.js", name: "config/db.js", group: 3, radius: 12 },
    { id: "controllers/user.js", name: "controllers/user.js", group: 4, radius: 12 },
    { id: "controllers/auth.js", name: "controllers/auth.js", group: 4, radius: 12 },
    { id: "controllers/product.js", name: "controllers/product.js", group: 4, radius: 12 },
    { id: "controllers/order.js", name: "controllers/order.js", group: 4, radius: 12 },
    { id: "models/User.js", name: "models/User.js", group: 5, radius: 10 },
    { id: "models/Product.js", name: "models/Product.js", group: 5, radius: 10 },
    { id: "models/Order.js", name: "models/Order.js", group: 5, radius: 10 },
    { id: "middleware/auth.js", name: "middleware/auth.js", group: 5, radius: 10 },
    { id: "middleware/error.js", name: "middleware/error.js", group: 5, radius: 10 },
  ],
  links: [
    { source: "app.js", target: "routes/index.js", value: 1 },
    { source: "app.js", target: "routes/api.js", value: 1 },
    { source: "app.js", target: "routes/users.js", value: 1 },
    { source: "app.js", target: "routes/auth.js", value: 1 },
    { source: "app.js", target: "config/db.js", value: 1 },
    { source: "app.js", target: "middleware/auth.js", value: 1 },
    { source: "app.js", target: "middleware/error.js", value: 1 },
    { source: "routes/index.js", target: "controllers/user.js", value: 1 },
    { source: "routes/api.js", target: "controllers/user.js", value: 1 },
    { source: "routes/users.js", target: "controllers/product.js", value: 1 },
    { source: "routes/auth.js", target: "controllers/auth.js", value: 1 },
    { source: "controllers/user.js", target: "models/User.js", value: 1 },
    { source: "controllers/auth.js", target: "models/User.js", value: 1 },
    { source: "controllers/product.js", target: "models/Product.js", value: 1 },
    { source: "controllers/order.js", target: "models/Order.js", value: 1 },
    { source: "middleware/auth.js", target: "controllers/auth.js", value: 1 },
    { source: "middleware/auth.js", target: "controllers/user.js", value: 1 },
    { source: "middleware/error.js", target: "controllers/product.js", value: 1 },
    { source: "middleware/error.js", target: "controllers/order.js", value: 1 },
  ]
};

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

  // For real implementation, fetch project data from API
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${id}`]
  });
  
  // For real implementation, fetch graph data from API
  const { data: graphData, isLoading: isLoadingGraph } = useQuery({
    queryKey: [`/api/projects/${id}/graph`],
    initialData: sampleGraphData
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

  if (isLoading) {
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
            <LanguageBadge language={project?.language || "nodejs"} />
          </div>
        </div>
        
        <AnalysisTabs projectId={id} activeTab="relationships" />
        
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
                    <label htmlFor="jsFiles" className="text-gray-300 cursor-pointer">JavaScript Files</label>
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
              
              <Button className="w-full bg-primary-600 text-white px-4 py-2 rounded-md mt-4 hover:bg-primary-700 transition-colors">
                Apply Filters
              </Button>
            </div>
          </div>
          
          {/* Visualization Graph */}
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
              ) : (
                <DependencyGraph 
                  data={graphData} 
                  width={800} 
                  height={400} 
                />
              )}
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Most Connected Files */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Most Connected Files</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-300">
                    <span className="material-icons text-[#f50057] mr-2">hub</span>
                    <span className="font-mono text-sm">app.js</span>
                    <span className="ml-auto text-white font-medium">7 connections</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="material-icons text-primary-400 mr-2">hub</span>
                    <span className="font-mono text-sm">middleware/auth.js</span>
                    <span className="ml-auto text-white font-medium">5 connections</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="material-icons text-primary-400 mr-2">hub</span>
                    <span className="font-mono text-sm">models/User.js</span>
                    <span className="ml-auto text-white font-medium">4 connections</span>
                  </li>
                </ul>
              </div>
              
              {/* Potential Issues */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Potential Issues</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-300">
                    <span className="material-icons text-[#ff9800] mr-2">warning</span>
                    <span className="text-sm">High coupling in <code className="font-mono">auth.js</code></span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="material-icons text-[#ff9800] mr-2">warning</span>
                    <span className="text-sm">Circular dependency risk between models</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="material-icons text-[#ff9800] mr-2">warning</span>
                    <span className="text-sm">Unused imports in <code className="font-mono">routes/api.js</code></span>
                  </li>
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
