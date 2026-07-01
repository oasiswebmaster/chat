import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FolderPlus, FilePlus, X } from 'lucide-react';

export function CreateItemModal({ 
  type, 
  onSubmit, 
  onClose,
  title,
  initialValue = '',
  submitLabel = 'Create'
}: { 
  type: 'folder' | 'document', 
  onSubmit: (name: string) => void, 
  onClose: () => void,
  title?: string,
  initialValue?: string,
  submitLabel?: string
}) {
  const [name, setName] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-sm bg-gray-900/80 backdrop-blur-2xl rounded-xl shadow-2xl border border-white/10 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3 text-gray-200">
            {type === 'folder' ? <FolderPlus size={20} className="text-gray-400" /> : <FilePlus size={20} className="text-gray-400" />}
            <h3 className="font-medium text-lg text-white">{title || `New ${type === 'folder' ? 'Folder' : 'Document'}`}</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-transparent hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${type} name`}
              autoFocus
              className="w-full px-4 py-2 border border-white/10 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-4 transition-all bg-black/40 font-medium text-white placeholder-gray-500"
            />
          </div>
          <div className="flex justify-end gap-2 text-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 font-medium text-sm rounded-lg hover:bg-white/10 transition-colors shadow-sm">Cancel</button>
            <button type="submit" disabled={!name.trim()} className="px-4 py-2 bg-white text-black font-medium text-sm rounded-lg hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50">{submitLabel}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
