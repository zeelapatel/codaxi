import React from 'react';

interface BrandTextProps {
  className?: string;
}

const BrandText: React.FC<BrandTextProps> = ({ className = "" }) => {
  return (
    <span className={className}>
      Cod<span className="text-[#f50057]">a</span>x<span className="text-[#f50057]">i</span>
    </span>
  );
};

export default BrandText;