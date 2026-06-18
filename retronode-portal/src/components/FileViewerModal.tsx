import React from 'react';
import { FileSystemNode } from '../types';
import { motion } from 'motion/react';
import { FileText, Image as ImageIcon, Music, X, Download } from 'lucide-react';
import { portalApi } from '../lib/api';

export function FileViewerModal({ file, onClose }: { file: FileSystemNode; onClose: () => void }) {
  const downloadLink = portalApi.downloadUrl(file.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-4xl"
      >
        <div className="bg-gray-900/80 backdrop-blur-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col border border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 text-white rounded-xl shadow-sm border border-white/5">
                {file.type === 'document' ? <FileText size={28} /> : file.type === 'image' ? <ImageIcon size={28} /> : <Music size={28} />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white truncate max-w-sm sm:max-w-md">{file.name.replace(/-/g, ' ')}</h2>
                <p className="text-sm text-gray-400 font-medium mt-0.5">
                  <span className="capitalize">{file.type}</span> • {file.size} • Modified {file.updatedAt}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={downloadLink}
                download
                className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-blue-400 hover:text-blue-300 rounded-full transition-colors flex items-center justify-center"
                title="Download"
                target="_blank"
                rel="noreferrer"
              >
                <Download size={20} strokeWidth={2.5} />
              </a>
              <button 
                onClick={onClose}
                className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-full transition-colors flex items-center justify-center -mr-2"
                title="Close Viewer"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Viewer Content Area */}
          <div className="p-6 sm:p-8 bg-black/40 min-h-[400px] max-h-[65vh] overflow-y-auto">
             {file.type === 'document' && (
                <div className="prose max-w-none">
                  {file.id.endsWith('.pdf') ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white/5 rounded-xl border border-white/10">
                      <FileText size={48} className="text-red-400 mb-6" />
                      <h3 className="text-xl font-bold text-white mb-2">PDF Document</h3>
                      <p className="text-gray-400 mb-6 max-w-sm text-center">To view this PDF document, please download it to your device.</p>
                      <a href={downloadLink} target="_blank" rel="noreferrer" className="px-6 py-2 bg-white text-black rounded-lg font-medium shadow-sm hover:bg-gray-200 transition">
                        Download PDF
                      </a>
                    </div>
                  ) : (
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed tracking-wide bg-white/5 p-6 rounded-xl border border-white/10">
                      {file.content || "Content must be downloaded to view. API integration streams file contents directly over downloads."}
                    </pre>
                  )}
                </div>
              )}
              
              {file.type === 'image' && (
                <div className="flex items-center justify-center h-full min-h-[300px]">
                  <img src={file.content || downloadLink} alt={file.name} className="max-w-full h-auto rounded-xl border border-white/10 object-contain max-h-[500px]" />
                </div>
              )}

              {file.type === 'video' && (
                <div className="flex items-center justify-center h-full min-h-[300px]">
                  <video src={file.content || downloadLink} controls className="max-w-full h-auto rounded-xl border border-white/10" />
                </div>
              )}

              {file.type === 'audio' && (
                <div className="flex items-center justify-center h-full min-h-[300px]">
                  <audio src={file.content || downloadLink} controls className="w-full max-w-md rounded-xl" />
                </div>
              )}

              {(!['document', 'image', 'video', 'audio'].includes(file.type)) && (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-xl border border-white/10">
                  <FileText size={48} className="text-gray-500 mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2">Unsupported Preview</h3>
                  <p className="text-gray-400 mb-6 max-w-sm text-center">This file type cannot be previewed. Please download to view.</p>
                  <a href={downloadLink} target="_blank" rel="noreferrer" className="px-6 py-2 bg-white text-black rounded-lg font-medium shadow-sm hover:bg-gray-200 transition">
                    Download File
                  </a>
                </div>
              )}
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-end gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-white text-black hover:bg-gray-200 font-medium text-sm rounded-lg transition-colors shadow-sm"
            >
              Done Reading
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
