// src/components/Scroll.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Scroll: React.FC<ScrollProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "relative bg-card p-6 border-y-4 border-yellow-800/50 shadow-lg",
        "before:content-[''] before:absolute before:-top-4 before:left-0 before:right-0 before:h-4 before:bg-gradient-to-b before:from-yellow-950/70 before:to-transparent",
        "after:content-[''] after:absolute after:-bottom-4 after:left-0 after:right-0 after:h-4 after:bg-gradient-to-t after:from-yellow-950/70 after:to-transparent",
        className
      )}
      style={{ backgroundImage: "url('/paper-texture.png')" }}
      {...props}
    >
      {children}
    </div>
  );
};