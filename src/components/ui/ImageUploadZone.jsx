import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Trash2, Link as LinkIcon, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { getUploadUrl } from '../../services/apiService';

const PRESET_BANNERS = [
  { label: 'Tech & Code', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop' },
  { label: 'Summit & Keynote', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop' },
  { label: 'Campus Culture', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop' },
  { label: 'Sports & Arena', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop' },
  { label: 'Workshop & Labs', url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=800&auto=format&fit=crop' },
];

export default function ImageUploadZone({
  label,
  value,
  previewUrl,
  onChange,
  onUpload,
  onUploadComplete,
  onClear,
  prefix = 'events',
  className = ''
}) {
  const currentImage = value || previewUrl || '';
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const fileInputRef = useRef(null);

  const notifyChange = (newUrl) => {
    if (onChange) onChange(newUrl);
    if (onUpload) onUpload(newUrl);
    if (onUploadComplete) onUploadComplete(newUrl);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      notifyChange('');
    }
    setCustomUrl('');
    setStatusMessage('');
  };

  const handleFileProcess = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.endsWith('.svg')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be 5 MB or less.');
      return;
    }

    setIsUploading(true);
    setStatusMessage('Reading image...');

    // 1. Instantly read into Data URL so preview and fallback are immediate
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      notifyChange(dataUrl);

      // 2. Attempt S3 presigned POST upload in background
      try {
        setStatusMessage('Uploading to cloud storage...');
        const uploadData = await getUploadUrl(file.type || 'image/jpeg', prefix);

        if (uploadData && uploadData.uploadUrl && uploadData.fields) {
          const formData = new FormData();
          Object.entries(uploadData.fields).forEach(([k, v]) => formData.append(k, v));
          formData.append('file', file);

          const res = await fetch(uploadData.uploadUrl, {
            method: 'POST',
            body: formData,
          });

          if (res.ok && uploadData.fileUrl) {
            notifyChange(uploadData.fileUrl);
            setStatusMessage('Uploaded to cloud!');
          } else {
            console.warn('[ImageUpload] Cloud upload non-200, kept local image');
            setStatusMessage('Saved locally');
          }
        }
      } catch (cloudErr) {
        console.warn('[ImageUpload] Cloud S3 unavailable, using local image data:', cloudErr);
        setStatusMessage('Saved locally');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      alert('Could not read image file.');
      setIsUploading(false);
      setStatusMessage('');
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApplyCustomUrl = (e) => {
    e?.preventDefault();
    if (!customUrl.trim()) return;
    notifyChange(customUrl.trim());
    setStatusMessage('External URL applied');
    setShowUrlInput(false);
  };

  return (
    <div className={`w-full text-left space-y-3 ${className}`}>
      {label && (
        <label className="block text-xs font-black uppercase tracking-wider text-black">
          {label}
        </label>
      )}

      {currentImage ? (
        // Preview State with Controls
        <div className="relative border-3 border-black bg-white neo-shadow overflow-hidden group">
          <div className="w-full h-56 md:h-64 bg-neutral-100 flex items-center justify-center overflow-hidden">
            <img
              src={currentImage}
              alt="Uploaded Preview"
              className="w-full h-full object-cover transition-transform group-hover:scale-[1.02] duration-300"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop';
              }}
            />
          </div>

          {/* Action Bar on Hover/Display */}
          <div className="bg-black text-white p-3 border-t-3 border-black flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase">
              <CheckCircle2 size={16} className="text-pastel-mint" />
              <span>Image Ready</span>
              {statusMessage && (
                <span className="text-[10px] text-pastel-yellow font-normal">({statusMessage})</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1 bg-pastel-yellow hover:bg-yellow-300 text-black border-2 border-black text-xs font-black uppercase tracking-wider transition-transform active:translate-y-px flex items-center gap-1.5"
              >
                {isUploading ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                Replace
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1 bg-red-400 hover:bg-red-500 text-black border-2 border-black text-xs font-black uppercase tracking-wider transition-transform active:translate-y-px flex items-center gap-1.5"
              >
                <Trash2 size={12} />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Empty / Upload State
        <div className="space-y-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-3 border-dashed border-black p-6 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging 
                ? 'bg-pastel-yellow border-black scale-[0.99]' 
                : 'bg-white hover:bg-pastel-yellow/30'
            }`}
          >
            <div className="w-14 h-14 bg-pastel-yellow border-2 border-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_#000]">
              {isUploading ? (
                <Loader2 className="w-7 h-7 text-black animate-spin" />
              ) : (
                <UploadCloud className="w-7 h-7 text-black" />
              )}
            </div>

            <h4 className="font-display font-black text-sm uppercase tracking-tight text-black mb-1">
              {isUploading ? 'Processing Image...' : 'Click to Upload or Drag & Drop'}
            </h4>
            <p className="text-xs font-bold text-black/60 uppercase tracking-wider mb-2">
              PNG, JPG, WebP, or SVG (Max 5MB)
            </p>
            {statusMessage && (
              <span className="text-xs font-black text-emerald-700 bg-pastel-mint px-2 py-0.5 border border-black">
                {statusMessage}
              </span>
            )}
          </div>

          {/* Quick Options: URL Input & Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs font-black uppercase tracking-wider text-black hover:underline inline-flex items-center gap-1"
            >
              <LinkIcon size={12} />
              {showUrlInput ? 'Hide URL input' : 'Or paste image link'}
            </button>

            <span className="text-[11px] font-bold text-black/50 uppercase">
              Or pick preset banner:
            </span>
          </div>

          {/* Optional Paste URL Bar */}
          {showUrlInput && (
            <div className="flex gap-2 p-2 bg-pastel-yellow border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="flex-1 border-2 border-black p-2 text-xs font-bold outline-none bg-white"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                className="px-4 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-black uppercase tracking-wider"
              >
                Apply URL
              </button>
            </div>
          )}

          {/* Quick Preset Badges */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_BANNERS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  notifyChange(preset.url);
                  setStatusMessage(`Preset: ${preset.label}`);
                }}
                className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-white hover:bg-pastel-mint border-2 border-black shadow-[1px_1px_0px_0px_#000] active:translate-y-px transition-all inline-flex items-center gap-1"
              >
                <Sparkles size={11} className="text-amber-500" />
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
            e.target.value = ''; // Reset for re-selection
          }
        }}
      />
    </div>
  );
}
