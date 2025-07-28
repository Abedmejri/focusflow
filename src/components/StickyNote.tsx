// src/components/StickyNote.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { Pin } from 'lucide-react';

interface StickyNoteProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  color: 'yellow' | 'blue' | 'green' | 'pink';
  rotation?: string;
}

const colorVariants = {
    yellow: "bg-[#FFF9C4] border-[#FBC02D]",
    blue: "bg-[#B3E5FC] border-[#0288D1]",
    green: "bg-[#C8E6C9] border-[#388E3C]",
    pink: "bg-[#F8BBD0] border-[#C2185B]",
};

export const StickyNote: React.FC<StickyNoteProps> = ({ children, color, rotation = "rotate-0", className, ...props }) => {
  return (
    <div
      className={cn(
        "relative p-6 pt-10 border-b-4 shadow-lg transition-all hover:shadow-xl hover:-translate-y-2 hover:rotate-0",
        colorVariants[color],
        rotation,
        className
      )}
      {...props}
    >
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gray-300 p-1 rounded-full shadow-inner">
          <Pin className="h-4 w-4 text-gray-600 -rotate-45" />
      </div>
      {children}
    </div>
  );
};