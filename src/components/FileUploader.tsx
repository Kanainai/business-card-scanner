import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

export function FileUploader({ onFileSelect }: FileUploaderProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === 'application/pdf') {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="w-full max-w-2xl p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
    >
      <label className="flex flex-col items-center space-y-4 cursor-pointer">
        <Upload className="w-12 h-12 text-gray-400" />
        <span className="text-lg font-medium text-gray-600">
          Drop your PDF here or click to upload
        </span>
        <span className="text-sm text-gray-500">
          Only PDF files are supported
        </span>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />
      </label>
    </div>
  );
}