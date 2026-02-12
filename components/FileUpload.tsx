import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { AppState } from '../types.ts';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  appState: AppState;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, appState }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (appState === AppState.PROCESSING) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        onFileSelect(file);
      } else {
        alert("Please upload an Excel or CSV file.");
      }
    }
  }, [onFileSelect, appState]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const isProcessing = appState === AppState.PROCESSING || appState === AppState.ANALYZING;

  return (
    <div 
      className={`
        relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white'}
        ${isProcessing ? 'opacity-50 pointer-events-none' : 'hover:border-blue-400 hover:bg-slate-50 cursor-pointer'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        accept=".xlsx,.xls,.csv" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        onChange={handleChange}
        disabled={isProcessing}
      />
      
      {isProcessing ? (
        <div className="flex flex-col items-center animate-pulse">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-lg font-medium text-slate-600">Processing Data...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center p-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            {isDragging ? <FileSpreadsheet className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            {isDragging ? 'Drop file here' : 'Drag & Drop Excel File'}
          </h3>
          <p className="text-slate-500 text-sm max-w-xs">
            Supports .xlsx, .xls, .csv files. 
            <br/>
            Files are processed locally in your browser.
          </p>
        </div>
      )}
    </div>
  );
};