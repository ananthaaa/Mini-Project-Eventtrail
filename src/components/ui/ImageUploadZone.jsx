import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';

export default function ImageUploadZone({ label, onUpload, previewUrl, onClear }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="w-full">
      {label && <label className="block text-text-primary text-sm font-medium mb-2">{label}</label>}
      
      {previewUrl ? (
        <div className="relative w-full h-64 bg-bg-surface rounded-xl border border-border-subtle overflow-hidden flex items-center justify-center group">
          <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
          <button 
            onClick={onClear}
            className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div 
          className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors
            ${isDragging ? 'border-accent bg-accent/10' : 'border-border-subtle bg-bg-surface hover:border-accent/50'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0];
              if (file.size > 5 * 1024 * 1024) {
                alert('File size must be 5 MB or less.');
                return;
              }
              // Set local preview immediately
              onUpload(URL.createObjectURL(file));
              
              // Upload to S3
              import('../../services/apiService').then(async ({ getUploadUrl }) => {
                try {
                  const { uploadUrl, fields, fileUrl } = await getUploadUrl(file.type, 'media');
                  const formData = new FormData();
                  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
                  formData.append('file', file);
                  
                  const response = await fetch(uploadUrl, {
                    method: 'POST',
                    body: formData,
                  });
                  
                  if (response.ok) {
                    onUpload(fileUrl);
                  } else {
                    alert('Upload failed.');
                  }
                } catch (error) {
                  console.error('Upload error', error);
                  alert('Upload error.');
                }
              });
            }
          }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = e.target.files[0];
              if (file) {
                if (file.size > 5 * 1024 * 1024) {
                  alert('File size must be 5 MB or less.');
                  return;
                }
                onUpload(URL.createObjectURL(file));
                import('../../services/apiService').then(async ({ getUploadUrl }) => {
                  try {
                    const { uploadUrl, fields, fileUrl } = await getUploadUrl(file.type, 'media');
                    const formData = new FormData();
                    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
                    formData.append('file', file);
                    
                    const response = await fetch(uploadUrl, {
                      method: 'POST',
                      body: formData,
                    });
                    
                    if (response.ok) {
                      onUpload(fileUrl);
                    } else {
                      alert('Upload failed.');
                    }
                  } catch (error) {
                    console.error('Upload error', error);
                    alert('Upload error.');
                  }
                });
              }
            };
            input.click();
          }}
        >
          <div className="w-16 h-16 rounded-full bg-bg-surface-alt flex items-center justify-center mb-4 text-text-secondary">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-text-primary font-medium mb-1">Click to upload or drag and drop</p>
          <p className="text-text-tertiary text-sm">SVG, PNG, JPG or GIF (max. 5MB)</p>
        </div>
      )}
    </div>
  );
}
