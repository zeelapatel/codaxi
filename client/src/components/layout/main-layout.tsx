import React from "react";
import Header from "./header";
import Footer from "./footer";
import { useTheme } from "@/context/theme-context";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className={`flex flex-col min-h-screen bg-[var(--app-bg)]`}>
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
