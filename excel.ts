import { CellAddress, ProcessingStats } from './types.ts';
import { getBatchCounts, incrementPhoneNumberCounts } from './db.ts';
import * as XLSX from 'xlsx';

export const processExcelFile = async (
  file: File, 
  onProgress: (msg: string) => void
): Promise<{ workbook: any; stats: ProcessingStats }> => {
  const startTime = performance.now();
  
  // 1. Read File
  onProgress("Reading file...");
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert sheet to JSON array of arrays (header: 1 means raw array of arrays)
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  
  let intraSheetDuplicates = 0;
  let historicalDuplicates = 0;
  let validNumbersCount = 0;
  let totalNumbers = 0;

  const seenInThisSheet = new Set<string>();
  const validNumbersToPersist: string[] = [];
  const cellsToCheck: { r: number; c: number; val: string }[] = [];

  onProgress("Scanning for intra-sheet duplicates...");

  // 2. Rule 1: Deduplication inside the same sheet
  // We iterate row by row, col by col.
  for (let r = 0; r < rawData.length; r++) {
    const row = rawData[r];
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c]).trim();
      
      // Basic cleaning: remove spaces, dashes? 
      // Assuming strict matching for now, but usually phone numbers need normalization.
      // Let's do basic normalization: remove non-digits.
      const rawPhone = cellVal.replace(/\D/g, ''); 

      if (rawPhone.length > 0) { // Only process if it looks like a number
        totalNumbers++;
        
        if (seenInThisSheet.has(rawPhone)) {
          // Rule 1 Violation: Already seen in this sheet.
          // Clear the cell in our rawData structure
          row[c] = ""; 
          intraSheetDuplicates++;
        } else {
          // First time seeing in this sheet.
          seenInThisSheet.add(rawPhone);
          // Mark for Rule 2 check
          cellsToCheck.push({ r, c, val: rawPhone });
        }
      }
    }
  }

  onProgress(`Checking historical frequency for ${cellsToCheck.length} unique numbers...`);

  // 3. Rule 2: Frequency control across history
  // We need to check the DB for all 'cellsToCheck'.
  // To optimize, we batch query.
  const uniqueNumbersToCheck = Array.from(new Set(cellsToCheck.map(item => item.val)));
  
  // Since IDB is async, fetching one by one is slow. We use a batch helper.
  // Note: For very large datasets, we might chunk this.
  const CHUNK_SIZE = 500;
  const historyCounts = new Map<string, number>();
  
  for (let i = 0; i < uniqueNumbersToCheck.length; i += CHUNK_SIZE) {
    const chunk = uniqueNumbersToCheck.slice(i, i + CHUNK_SIZE);
    const batchResult = await getBatchCounts(chunk);
    batchResult.forEach((count, phone) => historyCounts.set(phone, count));
  }

  // Apply Rule 2
  const numbersToIncrement: string[] = [];

  for (const cell of cellsToCheck) {
    const historicalCount = historyCounts.get(cell.val) || 0;
    
    // Rule: "If a phone number appears more than 2 times in total history... Only allow numbers whose total occurrence count is 1 or 2"
    // Interpretation: If current history is 0, new total is 1 (Allowed).
    // If current history is 1, new total is 2 (Allowed).
    // If current history is >= 2, new total is > 2 (Disallowed).
    
    if (historicalCount >= 2) {
      // Rule 2 Violation
      // Clear cell
      rawData[cell.r][cell.c] = ""; 
      historicalDuplicates++;
    } else {
      // Valid
      validNumbersCount++;
      numbersToIncrement.push(cell.val);
    }
  }

  // 4. Update History
  onProgress("Updating historical records...");
  // We only increment valid numbers.
  // Chunk the writes as well if necessary
  for (let i = 0; i < numbersToIncrement.length; i += CHUNK_SIZE) {
    const chunk = numbersToIncrement.slice(i, i + CHUNK_SIZE);
    await incrementPhoneNumberCounts(chunk);
  }

  // 5. Reconstruct Workbook
  onProgress("Generating clean file...");
  const newSheet = XLSX.utils.aoa_to_sheet(rawData);
  const newWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Cleaned Data");

  const endTime = performance.now();

  return {
    workbook: newWorkbook,
    stats: {
      totalRows: rawData.length,
      totalNumbers,
      intraSheetDuplicates,
      historicalDuplicates,
      validNumbers: validNumbersCount,
      processedFileName: file.name,
      processingTimeMs: Math.round(endTime - startTime)
    }
  };
};

export const downloadExcel = (workbook: any, originalName: string) => {
  const fileName = `cleaned_${originalName}`;
  XLSX.writeFile(workbook, fileName);
};