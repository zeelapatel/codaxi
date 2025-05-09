import React from "react";
import BrandText from "./brand-text";

interface LogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = "medium", className = "" }) => {
  const textSizeClasses = {
    small: "text-lg",
    medium: "text-xl",
    large: "text-2xl"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <span className="material-icons text-[#f50057] mr-2">
        account_tree
      </span>
      <span className={`${textSizeClasses[size]} font-medium text-[var(--app-text)]`}>
        <BrandText />
      </span>
    </div>
  );
};

export default Logo;