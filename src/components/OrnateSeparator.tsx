// src/components/OrnateSeparator.tsx
import React from 'react';
import { Sparkles } from 'lucide-react';

export const OrnateSeparator: React.FC = () => {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="flex-1 border-b border-primary/20"></div>
      <Sparkles className="h-5 w-5 mx-4 text-primary/50" />
      <div className="flex-1 border-b border-primary/20"></div>
    </div>
  );
};