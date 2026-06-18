import React from 'react';
import { X } from 'lucide-react';

export function DesktopWindow({ 
  title, 
  children, 
  className, 
  onClose 
}: { 
  title?: string; 
  children: React.ReactNode; 
  className?: string;
  onClose?: () => void;
}) {
  const showHeader = title || onClose;
  
  return (
    <div className={`bg-gray-900/60 backdrop-blur-2xl rounded-xl shadow-2xl border border-white/10 flex flex-col overflow-hidden relative ${className || ''}`}>
      {showHeader && (
        <div className="h-10 bg-white/5 border-b border-white/10 flex items-center justify-between px-4 shrink-0 z-20">
          <div className="font-medium text-gray-200 text-sm tracking-wide select-none">
            {title}
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10" title="Close">
              <X size={16} />
            </button>
          )}
        </div>
      )}
      
      {/* Window Body */}
      <div className="flex-1 flex flex-col overflow-hidden bg-transparent relative z-10 text-gray-200">
        {children}
      </div>
    </div>
  );
}
