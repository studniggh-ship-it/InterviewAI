import React from 'react';

export const SkeletonLoader: React.FC<{ count?: number; height?: string }> = ({ count = 3, height = 'h-24' }) => {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`w-full ${height} rounded-2xl skeleton-shimmer border border-white/5`}
        />
      ))}
    </div>
  );
};
