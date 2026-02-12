import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  History, 
  FileSpreadsheet, 
  Download,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { FileUpload } from './components/FileUpload.tsx';
import { StatsCard } from './components/StatsCard.tsx';
import { AnalysisView } from './components/AnalysisView.tsx';
import { processExcelFile, downloadExcel } from './services/excel.ts';
import { clearHistory } from './services/db.ts';
import { generateAnalysisReport } from './services/gemini.ts';
import { AppState, ProcessingStats } from './types.ts';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [cleanedWorkbook, setCleanedWorkbook] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");

  const handleFileProcess = async (file: File) => {
    try {
      setAppState(AppState.PROCESSING);
      setStats(null);
      setCleanedWorkbook(null);
      setAiAnalysis("");

      // 1. Process Excel
      const result = await processExcelFile(file, (msg) => setStatusMessage(msg));
      setCleanedWorkbook(result.workbook);
      setStats(result.stats);
      
      // 2. Generate AI Analysis
      setAppState(AppState.ANALYZING);
      setStatusMessage("Generating AI Analysis...");
      const analysis = await generateAnalysisReport(result.stats);
      setAiAnalysis(analysis);

      setAppState(AppState.COMPLETED);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      setStatusMessage("An error occurred during processing.");
    }
  };

  const handleDownload = () => {
    if (cleanedWorkbook && stats) {
      downloadExcel(cleanedWorkbook, stats.processedFileName);
    }
  };

  const handleResetHistory = async () => {
    if (confirm("Are you sure you want to clear all historical phone number frequency data? This cannot be undone.")) {
      await clearHistory();
      alert("Historical data cleared.");
    }
  };

  const handleResetApp = () => {
    setAppState(AppState.IDLE);
    setStats(null);
    setCleanedWorkbook(null);
    setAiAnalysis("");
    setStatusMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">DataCleanse Pro</h1>
          </div>
          <div className="flex items-center space-x-4">
             <button 
              onClick={handleResetHistory}
              className="text-slate-500 hover:text-red-600 transition-colors text-sm font-medium flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset History
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Daily Data Processing</h2>
          <p className="text-slate-500 text-lg">
            Upload your daily Excel sheet to automatically remove duplicates and enforce historical frequency limits.
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          {appState === AppState.COMPLETED ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between animate-fade-in">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-900">Processing Complete</h3>
                  <p className="text-green-700 text-sm">File ready for download</p>
                </div>
              </div>
              <div className="flex space-x-3">
                 <button 
                  onClick={handleResetApp}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Process Another
                </button>
                <button 
                  onClick={handleDownload}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition-all font-medium flex items-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Cleaned File
                </button>
              </div>
            </div>
          ) : (
            <>
              <FileUpload onFileSelect={handleFileProcess} appState={appState} />
              {statusMessage && appState !== AppState.IDLE && (
                <div className="mt-4 text-center text-slate-500 text-sm animate-pulse">
                  {statusMessage}
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="animate-fade-in-up">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Processing Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard 
                label="Total Numbers Found" 
                value={stats.totalNumbers.toLocaleString()} 
                icon={FileSpreadsheet}
                colorClass="bg-blue-500"
              />
              <StatsCard 
                label="Intra-Sheet Removed" 
                value={stats.intraSheetDuplicates.toLocaleString()} 
                icon={Trash2}
                colorClass="bg-yellow-500"
                subtext="Rule 1: Same Sheet Duplicates"
              />
              <StatsCard 
                label="History Limit Removed" 
                value={stats.historicalDuplicates.toLocaleString()} 
                icon={History}
                colorClass="bg-red-500"
                subtext="Rule 2: Exceeded 2x Total"
              />
              <StatsCard 
                label="Valid Numbers Kept" 
                value={stats.validNumbers.toLocaleString()} 
                icon={ShieldCheck}
                colorClass="bg-green-500"
                subtext={`${((stats.validNumbers / stats.totalNumbers) * 100).toFixed(1)}% Yield`}
              />
            </div>

            <AnalysisView stats={stats} aiAnalysis={aiAnalysis} />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;