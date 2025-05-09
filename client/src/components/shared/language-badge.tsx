import React from "react";

type LanguageBadgeProps = {
  language: string;
  className?: string;
};

const LanguageBadge: React.FC<LanguageBadgeProps> = ({ language, className = "" }) => {
  const languageMap: Record<string, string> = {
    nodejs: "Node.js",
    react: "React",
    python: "Python",
    java: "Java",
    c: "C/C++"
  };

  return (
    <span className={`language-badge ${language} font-medium ${className}`}>
      {languageMap[language] || language}
    </span>
  );
};

export default LanguageBadge;
