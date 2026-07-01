import React, { useState, useEffect } from 'react';
import { FileSystemNode } from '../types';
import { motion } from 'motion/react';
import { FileText, Image as ImageIcon, Music, X, Download, Loader2 } from 'lucide-react';
import { portalApi } from '../lib/api';
import mammoth from 'mammoth';

function DocxViewer({ downloadUrl }: { downloadUrl: string }) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const resp = await fetch(downloadUrl, { credentials: 'include' });
        if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) {
          setHtml(result.value);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load document');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [downloadUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={40} className="text-blue-400 animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Converting document for preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-xl border border-white/10">
        <FileText size={48} className="text-gray-500 mb-4" />
        <p className="text-gray-400 mb-4">Could not preview: {error}</p>
        <a href={downloadUrl} target="_blank" rel="noreferrer" className="px-6 py-2 bg-white text-black rounded-lg font-medium shadow-sm hover:bg-gray-200 transition">
          Download Instead
        </a>
      </div>
    );
  }

  return (
    <div
      className="docx-preview bg-white text-gray-900 rounded-xl p-6 sm:p-10 shadow-inner border border-white/10 max-w-3xl mx-auto prose prose-sm prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800 prose-table:text-gray-800"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function FileViewerModal({ 
  file, 
  onClose,
  isInsideTrash = false,
  onRestore,
  onDelete
}: { 
  file: FileSystemNode; 
  onClose: () => void;
  isInsideTrash?: boolean;
  onRestore?: (file: FileSystemNode) => void;
  onDelete?: (file: FileSystemNode) => void;
}) {
  const downloadLink = portalApi.downloadUrl(file.id);
  const ext = file.name.toLowerCase().split('.').pop() || '';
  const isDocx = ext === 'docx';
  const isPdf = ext === 'pdf';
  const isOfficeDoc = ['doc', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);

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
              {!isInsideTrash && (
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
              )}
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
             {isInsideTrash ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-xl border border-white/10 max-w-lg mx-auto my-8">
                  <FileText size={56} className="text-gray-400 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">Item in Trash</h3>
                  <p className="text-gray-400 mb-8 max-w-sm text-center">This file is in the Trash. Please restore it to view or edit its contents.</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        onRestore?.(file);
                        onClose();
                      }}
                      className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium shadow-sm transition"
                    >
                      Restore File
                    </button>
                    <button
                      onClick={() => {
                        onDelete?.(file);
                        onClose();
                      }}
                      className="px-6 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg font-medium shadow-sm transition"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
             ) : (
               <>
                 {file.type === 'document' && (
                    <div className="prose max-w-none">
                      {isPdf ? (
                        <div className="w-full h-[60vh] rounded-xl overflow-hidden border border-white/10 bg-white/5">
                          <iframe src={downloadLink} className="w-full h-full border-none" title={file.name} />
                        </div>
                      ) : isDocx ? (
                        <DocxViewer downloadUrl={downloadLink} />
                      ) : isOfficeDoc ? (
                        <div className="w-full h-[60vh] rounded-xl overflow-hidden border border-white/10 bg-white/5">
                          <iframe
                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + downloadLink)}`}
                            className="w-full h-full border-none"
                            title={file.name}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-xl border border-white/10">
                          <FileText size={48} className="text-gray-500 mb-4" />
                          <p className="text-gray-400 mb-6 max-w-sm text-center">This document type cannot be previewed in the browser.</p>
                          <a href={downloadLink} target="_blank" rel="noreferrer" className="px-6 py-2 bg-white text-black rounded-lg font-medium shadow-sm hover:bg-gray-200 transition">
                            Download File
                          </a>
                        </div>
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
               </>
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
