import React from "react";
import { Link } from "wouter";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1e1e1e] mt-12 border-t border-[#333333]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="material-icons text-[#f50057] mr-2">
              account_tree
            </span>
            <span className="text-xl font-medium text-white">Universal Codemap</span>
          </div>
          
          <div className="flex space-x-6">
            <Link href="/documentation/overview">
              <a className="text-gray-300 hover:text-white transition-colors">
                Documentation
              </a>
            </Link>
            <a href="https://github.com" className="text-gray-300 hover:text-white transition-colors">
              GitHub
            </a>
            <a href="#support" className="text-gray-300 hover:text-white transition-colors">
              Support
            </a>
          </div>
        </div>
        
        <div className="mt-6 border-t border-[#333333] pt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Universal Codemap. All rights reserved.
          </div>
          
          <div className="flex space-x-4">
            <a href="#privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
