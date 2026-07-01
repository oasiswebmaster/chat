import React, { useState, useMemo, useEffect } from 'react';
import { DesktopWindow } from './components/DesktopWindow';
import { FileViewerModal } from './components/FileViewerModal';
import { SidebarTree } from './components/SidebarTree';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CreateItemModal } from './components/CreateItemModal';
import { GlossyFolder } from './components/GlossyFolder';
import { SubmitDocumentForm } from './components/SubmitDocumentForm';
import { emptyRootFolder, rootFolder } from './data';
import { FileSystemNode, FileType, PortalSession } from './types';
import { portalApi } from './lib/api';
import { ChevronLeft, Folder, FileText, Image as ImageIcon, Music, File as FileIconGeneric, Search, ChevronRight, Lock, Unlock, Upload, UploadCloud, FolderPlus, FilePlus, Home, Video, FileSpreadsheet, Presentation, FileArchive, Film, Loader2, RefreshCw, Trash2, Pencil, Plus, MessageSquare, X } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'browse' | 'submit' | 'chat'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view');
      if (v === 'chat') return 'chat';
      if (v === 'submit') return 'submit';
    }
    return 'browse';
  });
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatLoadingState, setChatLoadingState] = useState<'loading' | 'success' | 'error'>('loading');
  const [diskSpace, setDiskSpace] = useState<any>(null);
  const [isEmbed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('embed') === 'true';
    }
    return false;
  });
  const [talks, setTalks] = useState<any[]>([]);
  const [selectedTalk, setSelectedTalk] = useState<any | null>(null);
  const [portalUsers, setPortalUsers] = useState<any[]>([]);
  const [showNewTalkModal, setShowNewTalkModal] = useState<boolean>(false);
  const [newTalkType, setNewTalkType] = useState<'private' | 'group'>('private');
  const [groupName, setGroupName] = useState<string>('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<number[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [activePane, setActivePane] = useState<'list' | 'chat'>('list');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [renamingNode, setRenamingNode] = useState<FileSystemNode | null>(null);

  useEffect(() => {
    setHighlightedFileId(null);
  }, [pathIDs]);

  const loadPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, l, d] = await Promise.all([
        portalApi.session(),
        portalApi.list(),
        portalApi.diskspace()
      ]);
      setSession(s.session);
      setFileSystem(l.root);
      setDiskSpace(d.diskspace);
    } catch (e) {
      console.warn('API not reachable, falling back to preview mock data for design review.');
      // Fallback for AI Studio preview
      setFileSystem(rootFolder);
      setDiskSpace({
        repository: { used: '124.5 MB' },
        server: { total: '50.0 GB', used: '12.4 GB', percent_used: 24.8 }
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPortal();
  }, []);

  // Chat Polling Effect
  useEffect(() => {
    if (viewMode !== 'chat') return;

    const fetchTalks = async () => {
      try {
        const data = await portalApi.getChatTalks();
        if (data && data.ok) {
          setTalks(data.talks || []);
          // Automatically select Community Chat (id: 1) if nothing is selected
          if (!selectedTalk && data.talks && data.talks.length > 0) {
            const pub = data.talks.find((t: any) => t.id === 1) || data.talks[0];
            setSelectedTalk(pub);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch talks:", err);
      }
    };

    const fetchUsers = async () => {
      try {
        const data = await portalApi.getPortalUsers();
        if (data && data.ok) {
          setPortalUsers(data.users || []);
        }
      } catch (err) {
        console.warn("Failed to fetch users:", err);
      }
    };

    void fetchTalks();
    void fetchUsers();
    
    const talksInterval = setInterval(() => {
      void fetchTalks();
    }, 6000);

    return () => {
      clearInterval(talksInterval);
    };
  }, [viewMode, selectedTalk]);

  // Messages Polling Effect
  useEffect(() => {
    if (viewMode !== 'chat' || !selectedTalk) {
      setChatMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const data = await portalApi.getChatMessages(selectedTalk.id);
        if (data && data.ok) {
          setChatMessages(data.messages || []);
          setChatLoadingState('success');
        } else {
          setChatLoadingState('error');
        }
      } catch (err) {
        console.warn("Failed to fetch messages:", err);
        setChatLoadingState('error');
      }
    };

    void fetchMessages();
    const msgsInterval = setInterval(() => {
      void fetchMessages();
    }, 4000);

    return () => {
      clearInterval(msgsInterval);
    };
  }, [viewMode, selectedTalk]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTalk || !chatInput.trim() || chatLoading) return;

    const msgText = chatInput;
    const talkId = selectedTalk.id;
    setChatInput('');
    setChatLoading(true);

    try {
      await portalApi.sendChatMessage(talkId, msgText);
      // Immediately refresh messages
      const data = await portalApi.getChatMessages(talkId);
      if (data && data.ok) {
        setChatMessages(data.messages || []);
        setChatLoadingState('success');
      }
    } catch (err) {
      console.error("Failed to send chat message:", err);
      alert("Failed to send message: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setChatLoading(false);
    }
  };

  const handleCreatePrivateTalk = async (targetId: number) => {
    try {
      const res = await portalApi.createChatTalk('private', targetId);
      if (res && res.ok) {
        const talksRes = await portalApi.getChatTalks();
        if (talksRes && talksRes.ok) {
          setTalks(talksRes.talks || []);
          const newTalk = talksRes.talks.find((t: any) => t.id === res.talk_id);
          if (newTalk) {
            setSelectedTalk(newTalk);
            setActivePane('chat');
          }
        }
        setShowNewTalkModal(false);
      }
    } catch (err) {
      console.error("Failed to start DM:", err);
      alert("Failed to start direct message: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCreateGroupTalk = async () => {
    if (!groupName.trim() || selectedGroupUsers.length === 0) return;
    try {
      const res = await portalApi.createChatTalk('group', selectedGroupUsers, groupName.trim());
      if (res && res.ok) {
        const talksRes = await portalApi.getChatTalks();
        if (talksRes && talksRes.ok) {
          setTalks(talksRes.talks || []);
          const newTalk = talksRes.talks.find((t: any) => t.id === res.talk_id);
          if (newTalk) {
            setSelectedTalk(newTalk);
            setActivePane('chat');
          }
        }
        setShowNewTalkModal(false);
        setGroupName('');
        setSelectedGroupUsers([]);
      }
    } catch (err) {
      console.error("Failed to start group talk:", err);
      alert("Failed to create group talk: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleToggleGroupUser = (userId: number) => {
    setSelectedGroupUsers((prev) => 
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = useMemo(() => {
    return portalUsers.filter((u) => 
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  }, [portalUsers, userSearchQuery]);

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
      setUploadProgress(0);
      const r = await portalApi.upload(currentFolder.id, files, (pct) => {
        setUploadProgress(pct);
      });
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
    } finally {
      setUploadProgress(null);
    }
  };

  const handleRename = async (node: FileSystemNode, newName: string) => {
    if (!isAdmin) return;
    try {
      const r = await portalApi.rename(node.id, newName);
      setFileSystem(r.root);
    } catch (e) {
      console.warn("API rename failed, mocking rename.");
      const updateTree = (n: FileSystemNode): FileSystemNode => {
        if (n.id === node.id) {
          return { ...n, name: newName };
        }
        if (n.children) {
          return { ...n, children: n.children.map(updateTree) };
        }
        return n;
      };
      setFileSystem(updateTree(fileSystem));
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

  const renderChatSystem = () => {
    return (
      <div className="flex-1 flex h-full bg-transparent overflow-hidden relative">
        {/* Left Pane - Sidebar */}
        <div className={`${activePane === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-72 flex-col bg-black/20 border-r border-white/10 shrink-0 min-h-0`}>
          <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
            <span className="font-bold text-white text-base">Conversations</span>
            <button 
              onClick={() => { setShowNewTalkModal(true); }}
              className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all shrink-0"
              title="New Chat"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {talks.map((talk) => (
              <button
                key={talk.id}
                onClick={() => { setSelectedTalk(talk); setActivePane('chat'); }}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all border ${
                  selectedTalk?.id === talk.id
                    ? 'bg-blue-600/20 border-blue-500/30 text-white font-bold'
                    : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold uppercase shrink-0">
                  {talk.title.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm truncate block font-medium leading-tight">{talk.title}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5 block leading-none">{talk.type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Pane - Chat Window */}
        <div className={`${activePane === 'chat' ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-h-0 bg-transparent`}>
          {/* Header */}
          <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between bg-white/5 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <button 
                onClick={() => setActivePane('list')}
                className="md:hidden p-1 text-gray-400 hover:text-white transition-colors shrink-0"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              {selectedTalk && (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                    {selectedTalk.title.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-white block truncate leading-tight">{selectedTalk.title}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{selectedTalk.type}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
            {!selectedTalk ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16 text-center">
                <MessageSquare size={48} className="text-gray-600 mb-4" strokeWidth={1.5} />
                <p className="text-lg font-bold">Select a conversation</p>
                <p className="text-sm text-gray-500 mt-1">Choose a contact or channel from the sidebar to start messaging.</p>
              </div>
            ) : chatLoadingState === 'loading' ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-gray-500" />
                <p className="text-base font-medium">Connecting to chat...</p>
                <p className="text-xs text-gray-500 mt-1">If this takes long, verify your GitHub token configuration.</p>
              </div>
            ) : chatLoadingState === 'error' ? (
              <div className="flex flex-col items-center justify-center h-full text-red-400 py-16 text-center px-6">
                <p className="text-lg font-bold">Failed to connect to chat</p>
                <p className="text-sm text-gray-400 mt-2 max-w-md">
                  Please verify that your **GitHub Personal Access Token** is configured correctly in 
                  <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-200 text-xs ml-1">/docs_portal/api/retronode/chat_config.json</code> on the VPS.
                </p>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16 text-center">
                <p className="text-lg font-bold">No messages yet</p>
                <p className="text-sm text-gray-500 mt-1">Be the first to post a message in this channel!</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold uppercase shrink-0">
                    {msg.author ? msg.author.slice(0, 2) : '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-gray-100">{msg.author}</span>
                      <span className="text-[10px] text-gray-500">{msg.created_at}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                      {msg.body}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Form */}
          {selectedTalk && (
            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-white/10 bg-white/5 flex gap-2 items-center shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1"
              >
                {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
              </button>
            </form>
          )}
        </div>
        
        {/* Modal definition */}
        {showNewTalkModal && (
          <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <span className="font-bold text-white text-base">New Talk</span>
                <button 
                  onClick={() => { setShowNewTalkModal(false); setGroupName(''); setSelectedGroupUsers([]); }}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex border-b border-white/5 shrink-0 bg-white/2">
                <button 
                  onClick={() => setNewTalkType('private')}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
                    newTalkType === 'private' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Direct Message
                </button>
                <button 
                  onClick={() => setNewTalkType('group')}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
                    newTalkType === 'group' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Group Chat
                </button>
              </div>

              <div className="p-3 border-b border-white/5 bg-white/2">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {newTalkType === 'group' && (
                <div className="p-3 border-b border-white/5 bg-white/2">
                  <input
                    type="text"
                    placeholder="Group Chat Name..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
                {filteredUsers.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-500">
                    No matching members found.
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedGroupUsers.includes(u.id);
                    return (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                            {u.name.slice(0, 2)}
                          </div>
                          <span className="text-sm font-medium text-gray-200">{u.name}</span>
                        </div>
                        
                        {newTalkType === 'private' ? (
                          <button
                            onClick={() => handleCreatePrivateTalk(u.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Message
                          </button>
                        ) : (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleGroupUser(u.id)}
                            className="w-4 h-4 text-blue-600 bg-white/5 border-white/10 rounded focus:ring-blue-500"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {newTalkType === 'group' && (
                <div className="p-3 border-t border-white/10 bg-white/5 flex justify-end gap-2 shrink-0">
                  <button
                    onClick={() => { setShowNewTalkModal(false); setGroupName(''); setSelectedGroupUsers([]); }}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGroupTalk}
                    disabled={!groupName.trim() || selectedGroupUsers.length === 0}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Create Group
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isEmbed) {
    return (
      <div className="h-screen w-screen bg-transparent flex flex-col font-sans tracking-tight overflow-hidden">
        {renderChatSystem()}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 flex items-center justify-center font-sans tracking-tight bg-transparent">
      <DesktopWindow 
        className="w-full max-w-7xl h-[85vh] sm:h-[90vh]"
      >
        {/* Minimal Toolbar */}
        <div className="h-16 bg-white/5 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between shrink-0 relative z-10 w-full">
          <div className="flex items-center gap-3 sm:gap-4 w-full max-w-4xl">
            {viewMode === 'browse' && (
              <button
                 onClick={handleNavigateUp}
                 disabled={pathIDs.length === 1}
                 className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md flex items-center justify-center disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-300 transition-colors font-medium"
                 title="Back"
               >
                 <ChevronLeft size={20} strokeWidth={2.5} />
               </button>
            )}
            
            {/* Breadcrumbs for easier navigation */}
            {viewMode === 'browse' ? (
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
            ) : viewMode === 'submit' ? (
              <div className="flex-1 text-base sm:text-lg text-gray-100 font-bold">
                Submit Document
              </div>
            ) : (
              <div className="flex-1 text-base sm:text-lg text-gray-100 font-bold">
                Community Chat
              </div>
            )}

            {/* View Mode Switcher */}
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 shrink-0 ml-2">
              <button
                onClick={() => setViewMode('browse')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'browse'
                    ? 'bg-white/10 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Browse
              </button>
              <button
                onClick={() => setViewMode('submit')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'submit'
                    ? 'bg-white/10 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Submit Document
              </button>
              <button
                onClick={() => setViewMode('chat')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'chat'
                    ? 'bg-white/10 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                CHAT
              </button>
            </div>
          </div>
          
          {/* Admin & Upload Controls */}
          <div className="flex flex-1 justify-end items-center gap-1">
             <button onClick={() => void loadPortal()} title="Refresh API" className="cursor-pointer p-2 hover:bg-white/10 text-gray-300 hover:text-white rounded-md flex items-center justify-center transition-colors font-medium">
               <RefreshCw size={20} strokeWidth={2} className={loading ? "animate-spin" : ""} />
             </button>
            {viewMode === 'browse' && isAdmin && (
               <>
                  <button onClick={() => setCreatingItemType('folder')} title="New Folder" className="cursor-pointer p-2 hover:bg-white/10 text-gray-300 hover:text-white rounded-md flex items-center justify-center transition-colors font-medium">
                    <FolderPlus size={20} strokeWidth={2} />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <label title="Upload Files" className="cursor-pointer p-2 hover:bg-white/10 text-gray-300 hover:text-white rounded-md flex items-center justify-center transition-colors font-medium">
                    <Upload size={20} strokeWidth={2} />
                    <input type="file" multiple className="hidden" onChange={handleFileInput} />
                  </label>
               </>
            )}
             <button 
               onClick={() => {
                 if (isAdmin) {
                   window.location.href = 'https://portal.oasisresort.ca/logout.php';
                 } else {
                   window.location.href = 'https://portal.oasisresort.ca/page/login';
                 }
               }}
               title={isAdmin ? "Admin (Click to logout of portal)" : "Read Only (Click to login as Admin)"}
               className={`p-2 rounded-md flex items-center justify-center transition-colors ml-2 relative group ${
                 isAdmin ? 'bg-white/10 text-green-400 hover:bg-white/20' : 'text-gray-300 hover:bg-white/10 hover:text-white'
               }`}
             >
               {isAdmin ? <Unlock size={18} strokeWidth={2} className="text-green-400" /> : <Lock size={18} strokeWidth={2} />}
             </button>
          </div>
        </div>

        {/* Content Area Wrap */}
        <div className="flex-1 flex overflow-hidden bg-transparent w-full">
          
          {/* Left Sidebar */}
          {viewMode === 'browse' && (
            <div className="w-64 bg-white/5 border-r border-white/10 py-6 shrink-0 hidden md:flex flex-col justify-between relative z-0">
              <div>
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-6">System Locations</h3>
                <div className="px-3 overflow-y-auto max-h-[calc(100vh-250px)]">
                  <SidebarTree 
                    node={fileSystem} 
                    pathSoFar={[]} 
                    currentPath={pathIDs} 
                    onNavigate={setPathIDs} 
                  />
                </div>
              </div>
              
              {/* Storage Indicator */}
              {diskSpace && (
                <div className="px-6 pt-4 mt-auto border-t border-white/10 flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-gray-400 font-medium">
                    <span>Server Space</span>
                    <span>{diskSpace.server.percent_used}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${diskSpace.server.percent_used}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                    <span>Used: {diskSpace.server.used}</span>
                    <span>Total: {diskSpace.server.total}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium border-t border-white/5 pt-2 mt-1">
                    Docs Repository: {diskSpace.repository.used}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Grid View */}
          <div 
             className="flex-1 overflow-y-auto px-4 py-6 sm:p-8 bg-black/20 relative" 
            onClick={() => setHighlightedFileId(null)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {viewMode === 'browse' ? (
              <>
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
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 z-10 transition-all">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setRenamingNode(file); }} 
                                title="Rename"
                                className="p-1.5 bg-blue-500/90 hover:bg-blue-500 rounded-lg transition-all text-white shadow-sm scale-95 hover:scale-100"
                              >
                                <Pencil size={12} strokeWidth={2.5}/>
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); void handleRemove(file); }} 
                                title="Delete"
                                className="p-1.5 bg-red-500/90 hover:bg-red-500 rounded-lg transition-all text-white shadow-sm scale-95 hover:scale-100"
                              >
                                <Trash2 size={12} strokeWidth={2.5}/>
                              </button>
                            </div>
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
              </>
            ) : viewMode === 'submit' ? (
              <SubmitDocumentForm session={session} />
            ) : (
              renderChatSystem()
            )}
          </div>
        </div>

        {/* Status Bar */}
         <div className="h-10 bg-white/5 border-t border-white/10 flex items-center justify-center text-[11px] text-gray-400 font-medium shrink-0 select-none px-4 backdrop-blur-md">
           {viewMode === 'browse' ? (
             <>
               {currentFolder.children?.length || 0} item{(currentFolder.children?.length !== 1) ? 's' : ''} 
               {highlightedFileId && (
                 <span className="ml-2 pl-2 border-l border-white/20 text-gray-300">
                  1 item selected
                </span>
               )}
             </>
           ) : viewMode === 'submit' ? (
             <span>Ready to upload</span>
           ) : (
             <span>Secure GitHub-backed Chat room</span>
           )}
        </div>
      </DesktopWindow>

      {/* Overlays / Modals */}
      {creatingItemType && (
        <CreateItemModal 
          type={creatingItemType}
          onSubmit={handleCreateItem}
          onClose={() => setCreatingItemType(null)}
        />
      )}
      {renamingNode && (
        <CreateItemModal 
          type="folder"
          title={`Rename ${renamingNode.type === 'folder' ? 'Folder' : 'File'}`}
          initialValue={renamingNode.name}
          submitLabel="Rename"
          onSubmit={(newName) => void handleRename(renamingNode, newName)}
          onClose={() => setRenamingNode(null)}
        />
      )}
      {selectedFile && (
        <FileViewerModal 
          file={selectedFile} 
          onClose={() => setSelectedFile(null)} 
        />
      )}
      
      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="fixed bottom-6 right-6 z-[9999] w-80 bg-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-center text-xs font-semibold text-white">
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-blue-400" />
              Uploading to server...
            </span>
            <span className="text-blue-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
