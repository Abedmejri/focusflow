// src/components/Tome.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

interface TomeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title: string;
  icon: React.ReactNode;
}

export const Tome: React.FC<TomeProps> = ({ children, title, icon, className, ...props }) => {
  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-primary/40 bg-card shadow-lg flex flex-col",
        "bg-gradient-to-br from-card to-muted/50", // Subtle gradient
        className
      )}
      style={{ backgroundImage: "url('/paper-texture.png')" }}
      {...props}
    >
      {/* Book Cover Decoration */}
      <div className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-accent rounded-tl-lg" />
      <div className="absolute -top-2 -right-2 w-8 h-8 border-r-2 border-t-2 border-accent rounded-tr-lg" />
      <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-2 border-b-2 border-accent rounded-bl-lg" />
      <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-accent rounded-br-lg" />
      
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="text-primary">{icon}</div>
          <h3 className="font-display text-2xl font-bold">{title}</h3>
        </div>
        <Separator className="my-4 bg-primary/20" />
      </div>

      <div className="px-6 pb-6 flex-1">
        {children}
      </div>
    </div>
  );
};