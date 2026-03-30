import { Transaction } from "@/types";

/**
 * Common column name variations for flexible detection
 */
const DESCRIPTION_COLUMNS = [
  "description",
  "memo",
  "merchant",
  "vendor",
  "name",
  "payee",
  "details",
  "transaction",
  "narrative",
  "merchant name",
  "transaction description",
];

const AMOUNT_COLUMNS = [
  "amount",
  "debit",
  "credit",
  "value",
  "sum",
  "total",
  "charge",
  "payment",
  "transaction amount",
];

const DATE_COLUMNS = [
  "date",
  "transaction date",
  "posted date",
  "posting date",
  "trans date",
  "settlement date",
  "post date",
];

/**
 * Parse a single CSV line handling quoted values
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Check for escaped quote (double quote)
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Don't forget the last field
  result.push(current.trim());
  return result;
}

/**
 * Find the index of a column by checking against known column names
 */
function findColumnIndex(
  header: string[],
  knownNames: string[]
): number {
  for (let i = 0; i < header.length; i++) {
    const col = header[i].toLowerCase().trim();
    if (knownNames.some((name) => col.includes(name))) {
      return i;
    }
  }
  return -1;
}

/**
 * Parse amount string to number, handling various formats
 */
function parseAmount(value: string): number {
  if (!value) return 0;

  // Remove currency symbols, commas, and whitespace
  let cleaned = value.replace(/[$£€,\s]/g, "").trim();

  // Handle parentheses for negative numbers (accounting format)
  const isNegative = cleaned.startsWith("(") && cleaned.endsWith(")");
  if (isNegative) {
    cleaned = cleaned.slice(1, -1);
  }

  // Handle explicit negative sign
  const hasNegativeSign = cleaned.startsWith("-");
  if (hasNegativeSign) {
    cleaned = cleaned.slice(1);
  }

  const amount = parseFloat(cleaned);
  if (isNaN(amount)) return 0;

  // Return absolute value - we'll treat all as expenses
  return Math.abs(amount);
}

/**
 * Parse date string to ISO format
 */
function parseDate(value: string): string {
  if (!value) return "";

  // Try to parse the date
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  // Return original if parsing fails
  return value;
}

export interface ParseResult {
  transactions: Transaction[];
  errors: string[];
  stats: {
    totalRows: number;
    parsedRows: number;
    skippedRows: number;
  };
}

/**
 * Parse CSV text into transactions
 */
export function parseCSV(text: string): ParseResult {
  const errors: string[] = [];
  const lines = text.trim().split(/\r?\n/);

  if (lines.length < 2) {
    return {
      transactions: [],
      errors: ["File must contain at least a header row and one data row"],
      stats: { totalRows: 0, parsedRows: 0, skippedRows: 0 },
    };
  }

  // Parse header
  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Find relevant columns
  let descIdx = findColumnIndex(header, DESCRIPTION_COLUMNS);
  let amountIdx = findColumnIndex(header, AMOUNT_COLUMNS);
  const dateIdx = findColumnIndex(header, DATE_COLUMNS);

  // Fallback: use first text-like column for description
  if (descIdx === -1) {
    descIdx = 0;
    errors.push(
      "Could not find description column, using first column"
    );
  }

  // Fallback: try to find a numeric column for amount
  if (amountIdx === -1) {
    // Look for a column with numeric-looking data
    for (let i = 0; i < header.length; i++) {
      if (i !== descIdx && i !== dateIdx) {
        amountIdx = i;
        break;
      }
    }
    if (amountIdx === -1) {
      amountIdx = header.length > 1 ? 1 : 0;
    }
    errors.push(
      "Could not find amount column, using fallback column"
    );
  }

  const transactions: Transaction[] = [];
  let skippedRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      skippedRows++;
      continue;
    }

    const values = parseCSVLine(line);

    // Skip if we don't have enough columns
    if (values.length <= Math.max(descIdx, amountIdx)) {
      skippedRows++;
      continue;
    }

    const description = values[descIdx]?.trim() || "";
    const amount = parseAmount(values[amountIdx] || "0");
    const date = dateIdx >= 0 ? parseDate(values[dateIdx]?.trim() || "") : "";

    // Skip if no description or zero/invalid amount
    if (!description || amount === 0) {
      skippedRows++;
      continue;
    }

    transactions.push({
      description,
      amount,
      date,
    });
  }

  return {
    transactions,
    errors,
    stats: {
      totalRows: lines.length - 1,
      parsedRows: transactions.length,
      skippedRows,
    },
  };
}

/**
 * Validate if a string looks like CSV content
 */
export function isValidCSV(text: string): boolean {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return false;

  // Check if first line looks like a header (has commas)
  const header = lines[0];
  if (!header.includes(",")) return false;

  // Check if at least one data row has the same number of columns
  const headerCols = parseCSVLine(header).length;
  for (let i = 1; i < Math.min(lines.length, 5); i++) {
    const rowCols = parseCSVLine(lines[i]).length;
    if (rowCols === headerCols) return true;
  }

  return false;
}

/**
 * Get detected column mapping info
 */
export function detectColumns(text: string): {
  description: string | null;
  amount: string | null;
  date: string | null;
  headers: string[];
} {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 1) {
    return { description: null, amount: null, date: null, headers: [] };
  }

  const headers = parseCSVLine(lines[0]);
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  const descIdx = findColumnIndex(lowerHeaders, DESCRIPTION_COLUMNS);
  const amountIdx = findColumnIndex(lowerHeaders, AMOUNT_COLUMNS);
  const dateIdx = findColumnIndex(lowerHeaders, DATE_COLUMNS);

  return {
    description: descIdx >= 0 ? headers[descIdx] : null,
    amount: amountIdx >= 0 ? headers[amountIdx] : null,
    date: dateIdx >= 0 ? headers[dateIdx] : null,
    headers,
  };
}
