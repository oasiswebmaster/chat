import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, X } from 'lucide-react';

export function AdminLoginModal({ onLogin, onClose }: { onLogin: (password: string) => boolean, onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Focus trap could be added, but autoFocus handles the primary input
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(password)) {
      onClose();
    } else {
      setError(true);
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
            <Lock size={20} className="text-blue-400" />
            <h3 className="font-medium text-lg text-white">Admin Authentication</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-gray-300 transition-colors">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="Enter admin password"
              autoFocus
              className={`w-full px-4 py-2 border ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-white/10 focus:ring-blue-500/20 focus:border-blue-500'} rounded-lg focus:outline-none focus:ring-4 transition-all bg-black/40 font-medium text-white placeholder-gray-500`}
            />
            {error && <p className="text-red-400 text-xs mt-2 font-medium">Incorrect password. Default is "password".</p>}
          </div>
          <div className="flex justify-end gap-2 text-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 font-medium text-sm rounded-lg hover:bg-white/10 transition-colors cursor-pointer shadow-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-white text-black font-medium text-sm rounded-lg hover:bg-gray-200 transition-colors shadow-sm cursor-pointer border border-transparent">Unlock</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
