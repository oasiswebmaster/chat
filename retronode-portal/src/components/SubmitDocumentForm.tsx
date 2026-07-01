import React, { useState, useEffect } from 'react';
import { PortalSession } from '../types';
import { portalApi } from '../lib/api';
import { UploadCloud, User, Mail, FileText, Send, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

interface SubmitDocumentFormProps {
  session: PortalSession;
  onSuccess?: () => void;
}

export function SubmitDocumentForm({ session, onSuccess }: SubmitDocumentFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pre-fill name and email when session loads
  useEffect(() => {
    if (session.authenticated) {
      if (session.name) setName(session.name);
      if (session.email) setEmail(session.email);
    }
  }, [session]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus({ type: 'error', text: 'Please select a file to upload.' });
      return;
    }
    if (!name.trim()) {
      setStatus({ type: 'error', text: 'Please enter your name.' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setStatus({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await portalApi.submitDoc(name, email, message, file);
      if (res.ok) {
        setStatus({ type: 'success', text: 'Your document has been submitted successfully to the managers.' });
        setFile(null);
        setMessage('');
        onSuccess?.();
      } else {
        setStatus({ type: 'error', text: 'Failed to submit document. Please try again.' });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        text: err instanceof Error ? err.message : 'An error occurred during submission. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8 px-2">
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 sm:p-8 shadow-xl">
        <div className="mb-6 sm:mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Submit Document</h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Upload and send a document directly to the Oasis Resort managers.
          </p>
        </div>

        {status && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
            status.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-300' 
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}>
            {status.type === 'success' ? (
              <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="shrink-0 mt-0.5" size={20} />
            )}
            <div className="text-sm font-medium">{status.text}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive 
                ? 'border-indigo-400 bg-indigo-500/5' 
                : file 
                  ? 'border-green-500/30 bg-green-500/5' 
                  : 'border-white/20 hover:border-white/30 bg-white/5'
            }`}
          >
            <input 
              type="file" 
              id="submit-file-input"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />

            {!file ? (
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white/5 text-gray-300 rounded-full flex items-center justify-center mb-4 border border-white/5">
                  <UploadCloud size={32} />
                </div>
                <p className="text-white font-semibold text-lg mb-1">
                  Drag & drop your document here
                </p>
                <p className="text-gray-400 text-sm mb-2">or click to browse your files</p>
                <p className="text-xs text-gray-500">PDF, Word, Excel, Images, etc.</p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-black/30 p-4 rounded-lg border border-white/5 max-w-lg mx-auto">
                <div className="flex items-center gap-3 text-left overflow-hidden">
                  <div className="p-2 bg-white/5 text-green-400 rounded-lg shrink-0">
                    <FileText size={24} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-white font-medium text-sm truncate">{file.name}</p>
                    <p className="text-gray-400 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={removeFile}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors shrink-0 relative z-10"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Grid for Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                Your Name
              </label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                Your Email
              </label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm font-medium"
              />
            </div>
          </div>

          {/* Message Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">
              Message (Optional)
            </label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a short message or note for the managers..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm font-medium resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-indigo-500/50 text-indigo-200 cursor-not-allowed' 
                : 'bg-indigo-500 hover:bg-indigo-600 text-white hover:shadow-indigo-500/10 hover:shadow-lg'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting Document...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit to Managers
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
