import { GoogleGenAI } from "@google/genai";
import { ProcessingStats } from "../types";

export const generateAnalysisReport = async (stats: ProcessingStats): Promise<string> => {
  // Safe check for API key availability via window polyfill
  // We cast to any to avoid TypeScript errors regarding 'process' not being defined globally in client-side config
  const apiKey = (window as any).process?.env?.API_KEY;

  if (!apiKey) {
    console.warn("No API_KEY found for Gemini.");
    return "AI insights unavailable. Please configure the API_KEY in index.html.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const prompt = `
      You are a Data Hygiene Analyst. Analyze the following processing statistics for a phone number dataset.
      
      File: ${stats.processedFileName}
      Total Rows: ${stats.totalRows}
      Total Numbers Found: ${stats.totalNumbers}
      Intra-sheet Duplicates Removed: ${stats.intraSheetDuplicates}
      Historical Frequency Violations Removed: ${stats.historicalDuplicates}
      Valid Numbers Retained: ${stats.validNumbers}
      Processing Time: ${stats.processingTimeMs}ms
      
      Provide a concise, professional summary (max 100 words). 
      Focus on the quality of the incoming data (percentage of duplicates) and the efficiency of the cleanup.
      Use a helpful and professional tone.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Analysis complete.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not generate AI analysis at this time.";
  }
};