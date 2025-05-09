import React from "react";
import { Link } from "wouter";
import Logo from "@/components/shared/logo";
import BrandText from "@/components/shared/brand-text";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[var(--app-surface)] mt-12 border-t border-[var(--app-border)]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Logo />
          </div>
          
          <div className="flex space-x-6">
            <Link href="/documentation/overview">
              <span className="text-[var(--app-text-secondary)] hover:text-[var(--app-text)] transition-colors cursor-pointer">
                Documentation
              </span>
            </Link>
            <a href="https://github.com" className="text-[var(--app-text-secondary)] hover:text-[var(--app-text)] transition-colors">
              GitHub
            </a>
            <a href="#support" className="text-[var(--app-text-secondary)] hover:text-[var(--app-text)] transition-colors">
              Support
            </a>
          </div>
        </div>
        
        <div className="mt-6 border-t border-[var(--app-border)] pt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-[var(--app-text-secondary)] text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} <BrandText />. All rights reserved.
          </div>
          
          <div className="flex space-x-4">
            <a href="#privacy" className="text-[var(--app-text-secondary)] hover:text-[var(--app-text)] transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="text-[var(--app-text-secondary)] hover:text-[var(--app-text)] transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
