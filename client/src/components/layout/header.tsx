import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
  const [location] = useLocation();

  return (
    <header className="bg-[#1e1e1e] shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center mr-8 cursor-pointer">
              <span className="material-icons text-[#f50057] mr-2">
                account_tree
              </span>
              <span className="text-xl font-medium text-white">Universal Codemap</span>
            </div>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex">
            <Link href="/">
              <a className={`mx-3 py-2 hover:text-[#f50057] transition-colors ${location === '/' ? 'text-[#f50057]' : 'text-white'}`}>
                Home
              </a>
            </Link>
            <Link href="/upload">
              <a className={`mx-3 py-2 hover:text-[#f50057] transition-colors ${location === '/upload' ? 'text-[#f50057]' : 'text-white'}`}>
                Start Analysis
              </a>
            </Link>
            <Link href="/documentation/overview">
              <a className={`mx-3 py-2 hover:text-[#f50057] transition-colors ${location.startsWith('/documentation') ? 'text-[#f50057]' : 'text-white'}`}>
                Documentation
              </a>
            </Link>
          </nav>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center">
          <Link href="/upload">
            <Button className="bg-[#f50057] text-white hover:bg-opacity-90">
              New Project
            </Button>
          </Link>
          <button className="ml-3 text-white bg-[#2d2d2d] p-2 rounded-full hover:bg-opacity-80 transition-colors">
            <span className="material-icons">
              account_circle
            </span>
          </button>
          <button className="md:hidden ml-3 text-white">
            <span className="material-icons">
              menu
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
