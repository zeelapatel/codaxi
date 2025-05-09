import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/theme-context";
import Logo from "@/components/shared/logo";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

const Header: React.FC = () => {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-[var(--app-surface)] shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          {/* Logo */}
          <Link href="/">
            <div className="cursor-pointer">
              <Logo className="mr-8" />
            </div>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex">
            <Link href="/">
              <span className={`mx-3 py-2 hover:text-[#f50057] transition-colors cursor-pointer ${location === '/' ? 'text-[#f50057]' : 'text-[var(--app-text)]'}`}>
                Home
              </span>
            </Link>
            <Link href="/upload">
              <span className={`mx-3 py-2 hover:text-[#f50057] transition-colors cursor-pointer ${location === '/upload' ? 'text-[#f50057]' : 'text-[var(--app-text)]'}`}>
                Start Analysis
              </span>
            </Link>
            <Link href="/documentation/overview">
              <span className={`mx-3 py-2 hover:text-[#f50057] transition-colors cursor-pointer ${location.startsWith('/documentation') ? 'text-[#f50057]' : 'text-[var(--app-text)]'}`}>
                Documentation
              </span>
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
          <button 
            onClick={toggleTheme}
            className="ml-3 text-[var(--app-text)] bg-[var(--app-surface-light)] p-2 rounded-full hover:bg-opacity-80 transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="material-icons">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button className="ml-3 text-[var(--app-text)] bg-[var(--app-surface-light)] p-2 rounded-full hover:bg-opacity-80 transition-colors">
            <span className="material-icons">
              account_circle
            </span>
          </button>
          <button className="md:hidden ml-3 text-[var(--app-text)]">
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
