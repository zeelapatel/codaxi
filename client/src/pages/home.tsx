import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const Home: React.FC = () => {
  return (
    <section className="py-12 md:py-20 fade-in">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-16">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
              AI-Powered <span className="text-[#f50057]">Code Documentation</span> Made Simple
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Universal Codemap analyzes your codebase, maps relationships between files, and generates comprehensive documentation with AI assistance.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/upload">
                <Button className="bg-[#f50057] text-white px-6 py-3 rounded-md font-medium hover:bg-opacity-90 transition-colors">
                  Start a New Project
                </Button>
              </Link>
              <Button variant="outline" className="border border-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-[#2d2d2d] transition-colors">
                Learn More
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            {/* Conceptual illustration of code visualization analysis */}
            <div className="relative w-full max-w-md h-64 md:h-80 bg-[#1e1e1e] rounded-xl shadow-lg overflow-hidden">
              <div className="absolute inset-0 opacity-20 flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 800 600" width="100%" height="100%" className="text-primary-300">
                    <g>
                      <circle cx="400" cy="300" r="50" fill="#3f51b5" className="graph-node" />
                      <circle cx="250" cy="200" r="30" fill="#5c6bc0" className="graph-node" />
                      <circle cx="550" cy="200" r="30" fill="#5c6bc0" className="graph-node" />
                      <circle cx="200" cy="400" r="25" fill="#7986cb" className="graph-node" />
                      <circle cx="350" cy="450" r="25" fill="#7986cb" className="graph-node" />
                      <circle cx="500" cy="380" r="25" fill="#7986cb" className="graph-node" />
                      <circle cx="600" cy="350" r="25" fill="#7986cb" className="graph-node" />
                      
                      <line x1="400" y1="300" x2="250" y2="200" stroke="#f50057" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="400" y1="300" x2="550" y2="200" stroke="#f50057" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="400" y1="300" x2="200" y2="400" stroke="#f50057" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="400" y1="300" x2="350" y2="450" stroke="#f50057" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="400" y1="300" x2="500" y2="380" stroke="#f50057" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="400" y1="300" x2="600" y2="350" stroke="#f50057" strokeWidth="2" strokeOpacity="0.6" />
                      <line x1="250" y1="200" x2="200" y2="400" stroke="#3f51b5" strokeWidth="1" strokeOpacity="0.4" />
                      <line x1="550" y1="200" x2="600" y2="350" stroke="#3f51b5" strokeWidth="1" strokeOpacity="0.4" />
                      <line x1="200" y1="400" x2="350" y2="450" stroke="#3f51b5" strokeWidth="1" strokeOpacity="0.4" />
                      <line x1="350" y1="450" x2="500" y2="380" stroke="#3f51b5" strokeWidth="1" strokeOpacity="0.4" />
                      <line x1="500" y1="380" x2="600" y2="350" stroke="#3f51b5" strokeWidth="1" strokeOpacity="0.4" />
                    </g>
                  </svg>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-[#2d2d2d] to-transparent opacity-50"></div>
              <div className="absolute top-0 left-0 right-0 p-4">
                <div className="flex items-center text-white">
                  <span className="material-icons mr-2 text-[#f50057]">data_object</span>
                  <span className="font-mono text-sm">Project Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Feature Showcase */}
        <div className="mb-16">
          <h2 className="text-3xl font-light text-white text-center mb-10">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#1e1e1e] rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-[#f50057] mb-4">
                <span className="material-icons text-4xl">analytics</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Intelligent Code Analysis</h3>
              <p className="text-gray-300">
                Automatically analyze project structure, identify dependencies, and map file relationships with advanced algorithms.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-[#1e1e1e] rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-[#f50057] mb-4">
                <span className="material-icons text-4xl">psychology</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">AI Documentation</h3>
              <p className="text-gray-300">
                Generate human-readable documentation with AI that explains code structure, purpose, and functionality.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-[#1e1e1e] rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-[#f50057] mb-4">
                <span className="material-icons text-4xl">hub</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Interactive Visualization</h3>
              <p className="text-gray-300">
                Explore your codebase through interactive graphs that visualize dependencies and relationships between components.
              </p>
            </div>
          </div>
        </div>
        
        {/* Language Support */}
        <div>
          <h2 className="text-3xl font-light text-white text-center mb-10">Language Support</h2>
          <div className="bg-[#1e1e1e] rounded-xl p-6 shadow-md">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {/* Node.js */}
              <div className="p-4 bg-[#2d2d2d] rounded-lg text-center border-2 border-primary-500">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="material-icons text-3xl text-[#8bc34a]">javascript</span>
                </div>
                <h4 className="text-white font-medium">Node.js</h4>
                <span className="inline-block mt-2 px-2 py-1 bg-[#4caf50] bg-opacity-20 text-[#4caf50] text-xs rounded-full">Available</span>
              </div>
              
              {/* React */}
              <div className="p-4 bg-[#2d2d2d] rounded-lg text-center">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="material-icons text-3xl text-[#61dafb]">code</span>
                </div>
                <h4 className="text-white font-medium">React</h4>
                <span className="inline-block mt-2 px-2 py-1 bg-[#2196f3] bg-opacity-20 text-[#2196f3] text-xs rounded-full">Coming Soon</span>
              </div>
              
              {/* Python */}
              <div className="p-4 bg-[#2d2d2d] rounded-lg text-center">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="material-icons text-3xl text-[#3572A5]">code</span>
                </div>
                <h4 className="text-white font-medium">Python</h4>
                <span className="inline-block mt-2 px-2 py-1 bg-[#2196f3] bg-opacity-20 text-[#2196f3] text-xs rounded-full">Coming Soon</span>
              </div>
              
              {/* Java */}
              <div className="p-4 bg-[#2d2d2d] rounded-lg text-center">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="material-icons text-3xl text-[#b07219]">code</span>
                </div>
                <h4 className="text-white font-medium">Java</h4>
                <span className="inline-block mt-2 px-2 py-1 bg-[#2196f3] bg-opacity-20 text-[#2196f3] text-xs rounded-full">Coming Soon</span>
              </div>
              
              {/* C/C++ */}
              <div className="p-4 bg-[#2d2d2d] rounded-lg text-center">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <span className="material-icons text-3xl text-[#555555]">code</span>
                </div>
                <h4 className="text-white font-medium">C/C++</h4>
                <span className="inline-block mt-2 px-2 py-1 bg-[#2196f3] bg-opacity-20 text-[#2196f3] text-xs rounded-full">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
