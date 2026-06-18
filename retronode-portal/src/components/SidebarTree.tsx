import React from 'react';
import { FileSystemNode } from '../types';
import { ChevronRight, ChevronDown, Folder, Home, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { GlossyFolder } from './GlossyFolder';

export function SidebarTree({
  node,
  pathSoFar,
  currentPath,
  onNavigate
}: {
  node: FileSystemNode;
  pathSoFar: string[];
  currentPath: string[];
  onNavigate: (path: string[]) => void;
}) {
  const myPath = [...pathSoFar, node.id];
  const isExpanded = currentPath.includes(node.id);
  const isSelected = currentPath[currentPath.length - 1] === node.id;

  if (node.type !== 'folder') return null;

  const getFolderIcon = () => {
    const className = "w-[18px] h-[18px]";
    const lowerName = node.name.toLowerCase();
    
    if (lowerName === 'home' || lowerName === 'root') {
      return <GlossyFolder color="blue" className={className} type="home" />;
    }
    if (lowerName === 'documents') {
      return <GlossyFolder color="emerald" className={className} type="documents" />;
    }
    if (lowerName === 'images' || lowerName === 'pictures') {
      return <GlossyFolder color="purple" className={className} type="images" />;
    }
    if (lowerName === 'video' || lowerName === 'videos') {
      return <GlossyFolder color="pink" className={className} type="video" />;
    }
    
    return <GlossyFolder color="cyan" className={className} type="default" />;
  };

  return (
    <div className="ml-2 first:ml-0 font-sans text-base">
      <div
        className={`flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer select-none transition-colors ${
          isSelected 
            ? 'bg-white/20 text-white shadow-sm font-medium' 
            : 'text-gray-300 hover:bg-white/10 font-medium'
        }`}
        onClick={() => onNavigate(myPath)}
      >
        <div className={`opacity-70 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
          {isExpanded ? <ChevronDown size={16} strokeWidth={2.5} /> : <ChevronRight size={16} strokeWidth={2.5} />}
        </div>
        {getFolderIcon()}
        <span className="truncate flex-1">{node.name.replace(/-/g, ' ')}</span>
      </div>
      
      {isExpanded && node.children && (
        <div className="ml-6 mt-1 space-y-1 border-l border-white/5 pl-2">
          {node.children.map(child => (
            child.type === 'folder' ? (
              <React.Fragment key={child.id}>
                <SidebarTree 
                  node={child} 
                  pathSoFar={myPath} 
                  currentPath={currentPath} 
                  onNavigate={onNavigate} 
                />
              </React.Fragment>
            ) : null
          ))}
        </div>
      )}
    </div>
  );
}
