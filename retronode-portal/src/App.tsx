import React, { useState, useMemo, useEffect } from 'react';
import { DesktopWindow } from './components/DesktopWindow';
import { FileViewerModal } from './components/FileViewerModal';
import { SidebarTree } from './components/SidebarTree';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CreateItemModal } from './components/CreateItemModal';
import { GlossyFolder } from './components/GlossyFolder';
import { emptyRootFolder, rootFolder } from './data';
import { FileSystemNode, FileType, PortalSession } from './types';
import { portalApi } from './lib/api';
import { ChevronLeft, Folder, FileText, Image as ImageIcon, Music, File as FileIconGeneric, Search, ChevronRight, Lock, Unlock, Upload, UploadCloud, FolderPlus, FilePlus, Home, Video, FileSpreadsheet, Presentation, FileArchive, Film, Loader2, RefreshCw, Trash2 } from 'lucide-react';

export default function App() {
  const [fileSystem, setFileSystem] = useState<FileSystemNode>(emptyRootFolder);
  const [session, setSession] = useState<PortalSession>({ authenticated: false, admin: false });
  const [pathIDs, setPathIDs] = useState<string[]>(['root']);
  const [selectedFile, setSelectedFile] = useState<FileSystemNode | null>(null);
  const [highlightedFileId, setHighlightedFileId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [creatingItemType, setCreatingItemType] = useState<'folder' | 'document' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHighlightedFileId(null);
  }, [pathIDs]);

  const loadPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, l] = await Promise.all([portalApi.session(), portalApi.list()]);
      setSession(s.session);
      setFileSystem(l.root);
    } catch (e) {
      console.warn('API not reachable, falling back to preview mock data for design review.');
      // Fallback for AI Studio preview
      setFileSystem(rootFolder);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPortal();
  }, []);

  const isAdmin = session.admin;

  const currentFolder = useMemo(() => {
    let current = fileSystem;
    for (let i = 1; i < pathIDs.length; i++) {
      const next = current.children?.find(c => c.id === pathIDs[i]);
      if (next) current = next;
    }
    return current;
  }, [pathIDs, fileSystem]);

  const absolutePathSegments = useMemo(() => {
    let current = fileSystem;
    let p = [fileSystem.name];
    for (let i = 1; i < pathIDs.length; i++) {
      const next = current.children?.find(c => c.id === pathIDs[i]);
      if (next) {
        current = next;
        p.push(next.name);
      }
    }
    return p;
  }, [pathIDs, fileSystem]);

  const handleCreateItem = async (name: string) => {
    if (!creatingItemType || !isAdmin) return;
    
    try {
      if (creatingItemType === 'folder') {
        const r = await portalApi.createFolder(currentFolder.id, name);
        setFileSystem(r.root);
      } else {
        // Not implemented in API yet, mock local update
        alert("Document creation not supported by API yet.");
      }
    } catch (e) {
      console.error(e);
      // Fallback for AI Studio preview testing
      const newNode: FileSystemNode = {
        id: Math.random().toString(36).substring(2, 11),
        name: name + (creatingItemType === 'document' && !name.includes('.') ? '.txt' : ''),
        type: creatingItemType,
        size: creatingItemType === 'folder' ? '' : '0 KB',
        updatedAt: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().slice(0,5),
        content: creatingItemType === 'document' ? 'New empty document...' : undefined,
        children: creatingItemType === 'folder' ? [] : undefined
      };
      
      const updateTree = (node: FileSystemNode): FileSystemNode => {
        if (node.id === currentFolder.id) return { ...node, children: [...(node.children || []), newNode] };
        if (node.children) return { ...node, children: node.children.map(updateTree) };
        return node;
      };
      setFileSystem(updateTree(fileSystem));
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!isAdmin || !files.length) return;
    try {
      const r = await portalApi.upload(currentFolder.id, files);
      setFileSystem(r.root);
    } catch (e) {
      console.warn("API upload failed, mocking upload.");
      // Fallback mock
      let currentFileSys = fileSystem;
      files.forEach((file) => {
        const newNode: FileSystemNode = {
          id: Math.random().toString(36).substring(2, 11),
          name: file.name,
          type: file.type.startsWith('image') ? 'image' : file.type.startsWith('audio') ? 'audio' : 'document',
          size: (file.size / 1024).toFixed(1) + ' KB',
          updatedAt: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().slice(0,5),
          content: URL.createObjectURL(file)
        };
        const updateTree = (node: FileSystemNode): FileSystemNode => {
          if (node.id === currentFolder.id) return { ...node, children: [...(node.children || []), newNode] };
          if (node.children) return { ...node, children: node.children.map(updateTree) };
          return node;
        };
        currentFileSys = updateTree(currentFileSys);
      });
      setFileSystem(currentFileSys);
    }
  };

  const handleRemove = async (node: FileSystemNode) => {
    if (!isAdmin || node.id === 'root' || !confirm(`Delete ${node.name}?`)) return;
    try {
      const r = await portalApi.remove(node.id);
      setFileSystem(r.root);
    } catch (e) {
      console.warn("API delete failed, mocking delete.");
      const removeNode = (n: FileSystemNode): FileSystemNode => {
        if (n.children) {
          return { ...n, children: n.children.filter(c => c.id !== node.id).map(removeNode) };
        }
        return n;
      };
      setFileSystem(removeNode(fileSystem));
    }
  };

  const handleNavigateUp = () => {
    if (pathIDs.length > 1) {
      setPathIDs(prev => prev.slice(0, -1));
    }
  };

  const handleFileAction = (file: FileSystemNode) => {
    if (file.type === 'folder') {
      setPathIDs(prev => [...prev, file.id]);
    } else {
      setSelectedFile(file);
    }
  };

  const getIconForType = (type: FileType, id: string) => {
    const className = `w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 drop-shadow-sm`;
    
    // Check if it's explicitly a PDF 
    if (id.endsWith('.pdf')) {
      return (
        <div className="relative">
          <FileText className={`${className} text-red-500`} strokeWidth={1.5} fill="#fee2e2" />
          <div className="absolute inset-0 flex items-center justify-center -mt-1 sm:-mt-2">
            <span className="text-[10px] sm:text-xs font-bold text-red-700 bg-white/50 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm border border-red-200/50">PDF</span>
          </div>
        </div>
      );
    }

    const lowerId = id.toLowerCase();
    
    // Spreadsheets
    if (lowerId.endsWith('.xls') || lowerId.endsWith('.xlsx') || lowerId.endsWith('.csv')) {
      return (
        <div className="relative">
          <FileSpreadsheet className={`${className} text-emerald-500`} strokeWidth={1.5} fill="#ecfdf5" />
          <div className="absolute inset-0 flex items-center justify-center -mt-1 sm:-mt-2">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-white/50 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm border border-emerald-200/50">XLS</span>
          </div>
        </div>
      );
    }

    // Presentations
    if (lowerId.endsWith('.ppt') || lowerId.endsWith('.pptx')) {
      return (
        <div className="relative">
          <Presentation className={`${className} text-orange-500`} strokeWidth={1.5} fill="#fff7ed" />
          <div className="absolute inset-0 flex items-center justify-center -mt-1 sm:-mt-2">
            <span className="text-[10px] sm:text-xs font-bold text-orange-800 bg-white/50 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm border border-orange-200/50">PPT</span>
          </div>
        </div>
      );
    }

    // Word / Text
    if (lowerId.endsWith('.doc') || lowerId.endsWith('.docx')) {
      return (
        <div className="relative">
          <FileText className={`${className} text-blue-500`} strokeWidth={1.5} fill="#eff6ff" />
          <div className="absolute inset-0 flex items-center justify-center -mt-1 sm:-mt-2">
            <span className="text-[10px] sm:text-xs font-bold text-blue-800 bg-white/50 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm border border-blue-200/50">DOC</span>
          </div>
        </div>
      );
    }

    // Zips
    if (lowerId.endsWith('.zip') || lowerId.endsWith('.rar') || lowerId.endsWith('.tar.gz')) {
      return <FileArchive className={`${className} text-amber-500`} strokeWidth={1.5} fill="#fffbeb" />;
    }
    
    // Videos
    if (lowerId.endsWith('.mp4') || lowerId.endsWith('.mov') || lowerId.endsWith('.avi')) {
      return <Film className={`${className} text-rose-500`} strokeWidth={1.5} fill="#fff1f2" />;
    }

    switch (type) {
      case 'folder': {
        const lowerName = id.toLowerCase();
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
        return <GlossyFolder color="cyan" className={className} />;
      }
      case 'document': return <FileText className={`${className} text-gray-400`} strokeWidth={1.5} fill="#374151" />;
      case 'image': return <ImageIcon className={`${className} text-purple-400`} strokeWidth={1.5} fill="#4c1d95" />;
      case 'audio': return <Music className={`${className} text-pink-400`} strokeWidth={1.5} fill="#831843" />;
      default: return <FileIconGeneric className={`${className} text-gray-500`} strokeWidth={1.5} fill="#374151" />;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isAdmin) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isAdmin) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void uploadFiles(Array.from(e.target.files));
    }
    e.target.value = ''; // Reset input
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 flex items-center justify-center font-sans tracking-tight bg-transparent">
      <DesktopWindow 
        className="w-full max-w-7xl h-[85vh] sm:h-[90vh]"
      >
        {/* Minimal Toolbar */}
        <div className="h-16 bg-white/5 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-10 w-full">
          <div className="flex items-center gap-3 sm:gap-4 w-full max-w-4xl">
            <button
               onClick={handleNavigateUp}
               disabled={pathIDs.length === 1}
               className="px-3 py-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-md flex items-center gap-2 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-300 transition-colors font-medium text-sm"
             >
               <ChevronLeft size={16} strokeWidth={2.5} /> <span className="hidden sm:inline">Back</span>
             </button>
            
            {/* Breadcrumbs for easier navigation */}
            <div className="flex-1 flex flex-wrap items-center gap-2 text-base sm:text-lg text-gray-400 font-medium overflow-hidden">
              {absolutePathSegments.map((segment, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight size={20} className="text-gray-500 shrink-0" />}
                  <span className={`truncate ${index === absolutePathSegments.length - 1 ? 'text-gray-100 font-bold' : ''}`}>
                    {segment.replace(/-/g, ' ')}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* Admin & Upload Controls */}
          <div className="flex flex-1 justify-end items-center gap-1">
             <button onClick={() => void loadPortal()} title="Refresh API" className="cursor-pointer px-3 py-1.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-md flex items-center gap-2 transition-colors font-medium text-sm">
               <RefreshCw size={16} strokeWidth={2} className={loading ? "animate-spin" : ""} /> <span className="hidden lg:inline">Sync</span>
             </button>
            {isAdmin && (
               <>
                 <button onClick={() => setCreatingItemType('folder')} title="New Folder" className="cursor-pointer px-3 py-1.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-md flex items-center gap-2 transition-colors font-medium text-sm">
                   <FolderPlus size={16} strokeWidth={2} /> <span className="hidden lg:inline">New Folder</span>
                 </button>
                 <div className="w-px h-4 bg-white/10 mx-1 hidden lg:block" />
                 <label className="cursor-pointer px-3 py-1.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-md flex items-center gap-2 transition-colors font-medium text-sm">
                   <Upload size={16} strokeWidth={2} /> <span className="hidden lg:inline">Upload Doc</span>
                   <input type="file" multiple className="hidden" onChange={handleFileInput} />
                 </label>
               </>
            )}
             <button 
               onClick={() => isAdmin ? setSession(s => ({ ...s, admin: false, authenticated: false })) : setShowLoginModal(true)}
               className={`px-3 py-1.5 rounded-md flex items-center gap-2 font-medium text-sm transition-colors ml-2 ${
                 isAdmin ? 'bg-white/10 text-white hover:bg-white/20' : 'text-gray-300 hover:bg-white/10 hover:text-white'
               }`}
             >
               {isAdmin ? <Unlock size={16} strokeWidth={2} className="text-green-400" /> : <Lock size={16} strokeWidth={2} />}
               <span className="hidden sm:inline">{isAdmin ? 'Admin' : 'Read Only'}</span>
             </button>
          </div>
        </div>

        {/* Content Area Wrap */}
        <div className="flex-1 flex overflow-hidden bg-transparent w-full">
          
          {/* Left Sidebar */}
          <div className="w-64 bg-white/5 border-r border-white/10 overflow-y-auto py-6 shrink-0 hidden md:block relative z-0">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-6">System Locations</h3>
            <div className="px-3">
              <SidebarTree 
                node={fileSystem} 
                pathSoFar={[]} 
                currentPath={pathIDs} 
                onNavigate={setPathIDs} 
              />
            </div>
          </div>

          {/* Main Grid View */}
          <div 
             className="flex-1 overflow-y-auto px-4 py-6 sm:p-8 bg-black/20 relative" 
            onClick={() => setHighlightedFileId(null)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && isAdmin && (
               <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md border-2 border-dashed border-white/30 flex flex-col items-center justify-center pointer-events-none transition-all m-4 rounded-xl">
                 <div className="w-20 h-20 bg-white/10 text-white rounded-full flex items-center justify-center mb-6">
                   <UploadCloud size={40} strokeWidth={2} />
                 </div>
                 <h2 className="text-2xl font-bold text-white tracking-tight">Drop files to upload</h2>
                 <p className="text-gray-300 font-medium text-base mt-2">Adding files to {currentFolder.name}</p>
               </div>
            )}
            
            <div className="mb-8 md:hidden px-2">
               <h1 className="text-3xl font-bold text-white">{currentFolder.name.replace(/-/g, ' ')}</h1>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 justify-items-center relative">
              {loading && (
                <div className="absolute inset-x-0 -top-12 flex justify-center">
                  <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
                    <Loader2 size={16} className="text-white animate-spin" />
                    <span className="text-sm font-medium text-white">Syncing...</span>
                  </div>
                </div>
              )}
              {currentFolder.children?.map(file => {
                const isHighlighted = highlightedFileId === file.id;
                
                return (
                  <div
                    key={file.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setHighlightedFileId(file.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleFileAction(file);
                    }}
                    className={`group flex flex-col items-center p-3 sm:p-4 w-full max-w-[160px] rounded-xl cursor-pointer transition-all border relative ${
                       isHighlighted 
                         ? 'bg-white/10 border-white/20 shadow-sm backdrop-blur-md' 
                         : 'border-transparent hover:bg-white/5'
                     }`}
                   >
                     {isAdmin && file.id !== 'root' && (
                        <button onClick={(e) => { e.stopPropagation(); void handleRemove(file); }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 bg-red-500/90 hover:bg-red-500 rounded-lg transition-all text-white shadow-sm z-10 scale-95 hover:scale-100">
                          <Trash2 size={14} strokeWidth={2.5}/>
                        </button>
                     )}
                     {getIconForType(file.type, file.name)}
                     <span 
                       className={`text-sm sm:text-base text-center leading-snug break-words w-full px-1 ${
                         isHighlighted ? 'text-white font-bold' : 'text-gray-200 font-medium'
                       }`}
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {file.name.replace(/-/g, ' ')}
                    </span>
                    {file.size && (
                       <span className="text-xs sm:text-sm text-gray-400 font-medium mt-2">{file.size}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {(!currentFolder.children || currentFolder.children.length === 0) && (
               <div className="flex flex-col items-center justify-center h-full text-gray-400 py-24 sm:py-32">
                 <Folder size={80} className="text-gray-600 mb-6" strokeWidth={1} fill="#374151" />
                 <p className="text-2xl font-bold text-gray-400">Folder is Empty</p>
                 <p className="text-lg mt-2 font-medium text-gray-500">No content available here.</p>
               </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
         <div className="h-10 bg-white/5 border-t border-white/10 flex items-center justify-center text-[11px] text-gray-400 font-medium shrink-0 select-none px-4 backdrop-blur-md">
           {currentFolder.children?.length || 0} item{(currentFolder.children?.length !== 1) ? 's' : ''} 
           {highlightedFileId && (
             <span className="ml-2 pl-2 border-l border-white/20 text-gray-300">
              1 item selected
            </span>
          )}
        </div>
      </DesktopWindow>

      {/* Overlays / Modals */}
      {showLoginModal && (
        <AdminLoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={(pwd) => {
            if (pwd === 'password') {
              setSession(s => ({ ...s, admin: true, authenticated: true }));
              return true;
            }
            return false;
          }}
        />
      )}
      {creatingItemType && (
        <CreateItemModal 
          type={creatingItemType}
          onSubmit={handleCreateItem}
          onClose={() => setCreatingItemType(null)}
        />
      )}
      {selectedFile && (
        <FileViewerModal 
          file={selectedFile} 
          onClose={() => setSelectedFile(null)} 
        />
      )}
    </div>
  );
}
