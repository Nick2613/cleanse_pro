export interface ProcessingStats {
  totalRows: number;
  totalNumbers: number;
  intraSheetDuplicates: number;
  historicalDuplicates: number;
  validNumbers: number;
  processedFileName: string;
  processingTimeMs: number;
}

export interface ProcessingHistoryItem {
  id: number;
  date: string;
  fileName: string;
  stats: ProcessingStats;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface CellAddress {
  r: number; // Row index (0-based)
  c: number; // Column index (0-based)
  val: string;
}
