import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

/**
 * Detect file type and route to the appropriate parser.
 */
export async function parseFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
        return parsePDF(file);
    }
    if (ext === 'csv') {
        return parseCSVFile(file);
    }
    return parseXLSX(file);
}

/**
 * Parse a raw CSV file directly (skip XLSX library to avoid re-encoding issues).
 */
async function parseCSVFile(file) {
    const text = await file.text();
    const accountInfo = parseCSVAccountInfo(text);
    const currency = accountInfo?.['Account Currency'] || null;
    const transactions = parseCSV(text, currency);
    return { transactions, csvString: text, accountInfo };
}

/**
 * Georgian → English key mapping for Credo Bank account info headers.
 */
const GEO_KEY_MAP = {
    'ანგარიშის მფლობელი': 'Account Holder',
    'საიდენტიფიკაციო ნომერი': 'Identification Number',
    'ამონაწერის პერიოდი': 'Statement Period',
    'ანგარიშის ნომერი': 'Account Number',
    'ანგარიშის ვალუტა': 'Account Currency',
    'საწყისი ნაშთი': 'Opening Balance',
    'საბოლოო ნაშთი': 'Closing Balance',
};

/** Normalize a key: map Georgian to English, or return as-is. */
function normalizeInfoKey(key) {
    return GEO_KEY_MAP[key] || key;
}

/**
 * Extract account info from CSV header lines (Credo Bank format).
 */
function parseCSVAccountInfo(csvText) {
    const lines = csvText.split('\n');
    const info = {};
    for (const line of lines) {
        if (/^\d{4}\//.test(line.trim())) break; // stop at first data row
        const match = line.match(/^([^,]+),(.+)/);
        if (match) {
            const rawKey = match[1].replace(':', '').trim();
            const val = match[2].trim();
            if (rawKey && val && !rawKey.startsWith('Date') && !rawKey.startsWith('თარიღი')) {
                info[normalizeInfoKey(rawKey)] = val;
            }
        }
    }
    return Object.keys(info).length > 0 ? info : null;
}

/**
 * Parse multiple files (XLSX, CSV, PDF) and merge transactions.
 */
export async function parseFiles(files) {
    const allTransactions = [];
    const accountInfos = [];

    for (const file of files) {
        // Try to detect currency from filename (e.g., ..._GEL_STATEMENT_... or ..._USD_STATEMENT_...)
        const filenameCurrency = detectCurrencyFromFilename(file.name);

        const result = await parseFile(file);

        // Determine currency: accountInfo > filename > default
        const currency = result.accountInfo?.['Account Currency'] || filenameCurrency || 'GEL';

        // Stamp every transaction with its currency
        for (const tx of result.transactions) {
            if (!tx.currency) tx.currency = currency;
        }

        allTransactions.push(...result.transactions);
        if (result.accountInfo) {
            accountInfos.push(result.accountInfo);
        }
    }

    // Sort by date ascending (oldest first)
    allTransactions.sort((a, b) => a.date.localeCompare(b.date));

    // Return first accountInfo for backward compat, plus array of all
    return {
        transactions: allTransactions,
        accountInfo: accountInfos[0] || null,
        accountInfos,
    };
}

/**
 * Try to detect currency from filename (Credo Bank and common patterns).
 * e.g. MYCREDO_..._GEL_STATEMENT_..., statement_USD.pdf, GEL.xlsx, ..._USD_
 */
function detectCurrencyFromFilename(filename) {
    const upper = filename.toUpperCase();
    const patterns = [
        /_(GEL|USD|EUR|RUB|GBP)_/i,
        /[._-](GEL|USD|EUR|RUB|GBP)[._-]/i,
        /(GEL|USD|EUR|RUB|GBP)\.(PDF|XLSX?|CSV)/i,
        /STATEMENT[._-](GEL|USD|EUR|RUB|GBP)/i,
        /(GEL|USD|EUR|RUB|GBP)\s*STATEMENT/i,
    ];
    for (const re of patterns) {
        const m = filename.match(re);
        if (m) return m[1].toUpperCase();
    }
    return null;
}

/**
 * Parse a Credo Bank PDF file.
 * Supports two formats:
 *  1. Full account statement (multi-page table)
 *  2. Single transaction receipt (Payment Order)
 */
export async function parsePDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Extract text items with positions from all pages
    const allItems = [];
    let page1Text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageItems = content.items
            .filter(item => item.str.trim())
            .map(item => ({
                str: item.str.trim(),
                x: Math.round(item.transform[4]),
                y: Math.round(item.transform[5]),
                page: i,
            }));
        allItems.push(...pageItems);
        if (i === 1) {
            page1Text = content.items.map(item => item.str).join(' ');
        }
    }

    // Detect format: full statement has "Account Statement" header
    const isStatement = page1Text.includes('Account Statement') || page1Text.includes('ამონაწერი');

    if (isStatement) {
        return parsePDFStatement(allItems, page1Text);
    }
    return parsePDFReceipt(page1Text);
}

// Default column X boundaries (calibrated for GEL statements)
const DEFAULT_COL = {
    DATE_MAX: 100, OP_MAX: 195, DB_MAX: 270, CR_MAX: 340,
    BAL_MAX: 400, DESC_MAX: 530, BNAME_MAX: 665,
};

// Header strings to filter out of data rows (exact + split variants)
const HEADER_STRINGS = new Set([
    'Date', 'თარიღი', 'Operation', 'ოპერაცია',
    'Turnover (DB)', 'ბრუნვა (დებ)', 'Turnover (Cr)', 'ბრუნვა (კრ)',
    'Turnover', 'ბრუნვა', '(DB)', '(Cr)', '(დებ)', '(კრ)',
    'Balance', 'ნაშთი', 'Description', 'დანიშნულება',
    'Beneficiary Name', 'ბენეფიციარის სახელი',
    'Beneficiary Account', 'ბენეფიციარის ანგარიში',
    'Beneficiary', 'ბენეფიციარის',
]);

/** Check if item is a header (exact match or truncated Georgian prefix). */
function isHeaderText(str) {
    if (HEADER_STRINGS.has(str)) return true;
    return ['ბენეფიციარის ანგარ', 'ბენეფიციარის სახელ', 'ბრუნვა (დებ', 'ბრუნვა (კრ']
        .some(p => str.startsWith(p));
}

/**
 * Check if string is a valid monetary amount ("123.45", "1,234.56").
 * Credo amounts always have exactly 2 decimal places.
 */
function isMonetaryStr(str) {
    if (!str) return false;
    const s = str.replace(/,/g, '').trim();
    return s !== '' && /^\d+\.\d{2}$/.test(s);
}

/**
 * Extract a valid monetary amount from column items.
 * Ignores stray non-monetary text that leaked from adjacent columns.
 */
function extractAmount(items) {
    // Try individual items first (most common: single item like "318.58")
    const valid = items.find(s => isMonetaryStr(s));
    if (valid) return parseAmount(valid);
    // Try joining (handles split amounts like "1,234" + ".56")
    const joined = items.join('');
    if (isMonetaryStr(joined)) return parseAmount(joined);
    return 0;
}

/**
 * Detect column boundaries dynamically from PDF header positions.
 * Handles exact matches, startsWith for truncated Georgian, and split multi-word headers.
 */
function detectColumnBoundaries(items) {
    const page1 = items.filter(i => i.page === 1);
    const pos = {};

    // Pass 1: exact + startsWith matching
    for (const item of page1) {
        const s = item.str;
        if (!pos.date && (s === 'Date' || s === 'თარიღი')) pos.date = item.x;
        if (!pos.operation && (s === 'Operation' || s === 'ოპერაცია')) pos.operation = item.x;
        if (!pos.debit && (s === 'Turnover (DB)' || s.startsWith('ბრუნვა (დებ'))) pos.debit = item.x;
        if (!pos.credit && (s === 'Turnover (Cr)' || s.startsWith('ბრუნვა (კრ'))) pos.credit = item.x;
        if (!pos.balance && (s === 'Balance' || s === 'ნაშთი')) pos.balance = item.x;
        if (!pos.description && (s === 'Description' || s === 'დანიშნულება')) pos.description = item.x;
        if (!pos.benefName && (s === 'Beneficiary Name' || s.startsWith('ბენეფიციარის სახელ'))) pos.benefName = item.x;
        if (!pos.benefAccount && (s === 'Beneficiary Account' || s.startsWith('ბენეფიციარის ანგარ'))) pos.benefAccount = item.x;
    }

    // Pass 2: split multi-word headers ("Turnover" + "(DB)", "Beneficiary" + "Name")
    if (pos.debit === undefined || pos.credit === undefined) {
        for (const item of page1) {
            if (item.str === 'Turnover' || item.str === 'ბრუნვა') {
                const near = page1.find(j =>
                    j !== item && Math.abs(j.y - item.y) < 15 && j.x > item.x && j.x - item.x < 80
                );
                if (near) {
                    if (!pos.debit && (near.str.includes('DB') || near.str.includes('დებ'))) pos.debit = item.x;
                    if (!pos.credit && (near.str.includes('Cr') || near.str.includes('კრ'))) pos.credit = item.x;
                }
            }
        }
    }
    if (pos.benefName === undefined || pos.benefAccount === undefined) {
        for (const item of page1) {
            if (item.str === 'Beneficiary' || item.str === 'ბენეფიციარის') {
                const near = page1.find(j =>
                    j !== item && Math.abs(j.y - item.y) < 15 && j.x > item.x && j.x - item.x < 130
                );
                if (near) {
                    if (!pos.benefName && (near.str.startsWith('Name') || near.str.startsWith('სახელ'))) pos.benefName = item.x;
                    if (!pos.benefAccount && (near.str.startsWith('Account') || near.str.startsWith('ანგარ'))) pos.benefAccount = item.x;
                }
            }
        }
    }

    // Must have at least the 3 numeric columns
    if (pos.debit === undefined || pos.credit === undefined || pos.balance === undefined) {
        return DEFAULT_COL;
    }

    const mid = (a, b) => (a !== undefined && b !== undefined) ? Math.round((a + b) / 2) : undefined;

    // For missing columns, estimate from known positions instead of hardcoded defaults
    return {
        DATE_MAX: mid(pos.date, pos.operation) ?? mid(pos.date, pos.debit) ?? DEFAULT_COL.DATE_MAX,
        OP_MAX: mid(pos.operation, pos.debit) ?? (pos.debit - 15),
        DB_MAX: mid(pos.debit, pos.credit),
        CR_MAX: mid(pos.credit, pos.balance),
        BAL_MAX: mid(pos.balance, pos.description) ?? (pos.balance + Math.round((pos.credit - pos.debit) * 0.8)),
        DESC_MAX: mid(pos.description, pos.benefName) ?? (pos.benefName !== undefined ? pos.benefName - 15 : DEFAULT_COL.DESC_MAX),
        BNAME_MAX: mid(pos.benefName, pos.benefAccount) ?? DEFAULT_COL.BNAME_MAX,
    };
}

/**
 * Parse a full multi-page PDF account statement.
 * Uses text item positions to reconstruct table rows.
 */
function parsePDFStatement(items, page1Text) {
    const accountInfo = extractStatementAccountInfo(page1Text);
    const COL = detectColumnBoundaries(items);

    // Filter out header rows (exact match + truncated Georgian prefixes)
    const dataItems = items.filter(item => !isHeaderText(item.str));

    // Find all date entries (DD.MM.YYYY at x < 100) — these mark row starts
    const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
    const rowStarts = [];
    for (let i = 0; i < dataItems.length; i++) {
        const item = dataItems[i];
        if (item.x < COL.DATE_MAX && datePattern.test(item.str)) {
            rowStarts.push({ index: i, page: item.page, y: item.y, dateStr: item.str });
        }
    }

    const transactions = [];
    for (let r = 0; r < rowStarts.length; r++) {
        const start = rowStarts[r];
        const nextStart = rowStarts[r + 1];

        // Find the previous row on the same page to calculate upper boundary
        const prevOnPage = r > 0 && rowStarts[r - 1].page === start.page ? rowStarts[r - 1] : null;

        // Upper bound: midpoint to previous row, or top of data area (below header ~y=510)
        const upperBound = prevOnPage
            ? Math.round((start.y + prevOnPage.y) / 2)
            : 510;

        // Lower bound: midpoint to next row on same page, or bottom of page
        const lowerBound = nextStart && nextStart.page === start.page
            ? Math.round((start.y + nextStart.y) / 2)
            : -Infinity;

        // Collect all items belonging to this row
        const rowItems = [];
        for (let i = start.index - 20; i < dataItems.length; i++) {
            if (i < 0) continue;
            const item = dataItems[i];
            if (nextStart && i >= nextStart.index + 20) break;
            if (item.page === start.page && item.y <= upperBound && item.y > lowerBound) {
                rowItems.push(item);
            }
        }

        // Assign items to columns based on x coordinate
        const cols = { date: '', operation: [], debit: [], credit: [], balance: [], description: [], benefName: [], benefAccount: [] };
        cols.date = start.dateStr;

        for (const item of rowItems) {
            if (item.x < COL.DATE_MAX) continue; // skip date itself
            if (item.x < COL.OP_MAX) cols.operation.push(item.str);
            else if (item.x < COL.DB_MAX) cols.debit.push(item.str);
            else if (item.x < COL.CR_MAX) cols.credit.push(item.str);
            else if (item.x < COL.BAL_MAX) cols.balance.push(item.str);
            else if (item.x < COL.DESC_MAX) cols.description.push(item.str);
            else if (item.x < COL.BNAME_MAX) cols.benefName.push(item.str);
            else cols.benefAccount.push(item.str);
        }

        // Convert DD.MM.YYYY → YYYY/MM/DD
        const [dd, mm, yyyy] = cols.date.split('.');
        const date = `${yyyy}/${mm}/${dd}`;

        const operation = cols.operation.join(' ');
        const debit = extractAmount(cols.debit);
        const credit = extractAmount(cols.credit);
        const balance = extractAmount(cols.balance);
        const description = cols.description.join(' ');
        const beneficiaryName = cols.benefName.join(' ');
        const beneficiaryAccount = cols.benefAccount.join(' ');

        const type = credit > 0 ? 'income' : 'expense';

        transactions.push({
            date,
            operation,
            debit,
            credit,
            balance,
            description,
            beneficiaryName,
            beneficiaryAccount,
            type,
            amount: type === 'income' ? credit : debit,
            currency: accountInfo?.['Account Currency'] || 'GEL',
        });
    }

    return { transactions, accountInfo };
}

/**
 * Extract account info from the first page of a PDF statement.
 */
function extractStatementAccountInfo(text) {
    const t = text.replace(/\u00AD/g, '').replace(/\s+/g, ' ');
    const info = {};

    const holderMatch = t.match(/Account\s+Holder\s+([A-Z\s]+?)(?:\s+საიდენტიფიკაციო|\s+\d)/);
    if (holderMatch) info['Account Holder'] = holderMatch[1].trim();

    const accountMatch = t.match(/Account\s+Number\s+(GE\w+)/);
    if (accountMatch) info['Account Number'] = accountMatch[1].trim();

    const currencyMatch = t.match(/Account\s+Currency\s+(\w+)/);
    if (currencyMatch) info['Account Currency'] = currencyMatch[1].trim();

    const periodMatch = t.match(/Statement\s+Period\s+([\d.]+\s*-\s*[\d.]+)/);
    if (periodMatch) info['Statement Period'] = periodMatch[1].trim();

    return Object.keys(info).length > 0 ? info : null;
}

/**
 * Parse a single transaction receipt PDF (Payment Order).
 */
function parsePDFReceipt(text) {
    const t = text.replace(/\u00AD/g, '').replace(/\s+/g, ' ');

    const dateMatch = t.match(/Operation\s+Date\s+(\d{4})-?(\d{2})-?(\d{2})/);
    if (!dateMatch) return { transactions: [], accountInfo: null };
    const date = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;

    const amountMatch = t.match(/Amount:\s*([\d,]+\.?\d*)\s*(GEL|USD|EUR|RUB)?/i);
    const amount = amountMatch ? parseAmount(amountMatch[1]) : 0;

    const detailsMatch = t.match(/Operation\s+Details:\s*(.+?)(?:\s+დაბეჭდილია|\s+printed)/i);
    const operation = detailsMatch ? detailsMatch[1].trim() : 'Payment Order';

    const receiverNameMatch = t.match(/Receiver\s*Name:\s*(.+?)(?:\s+ანგარიშის|\s+Account\s*Number)/i);
    const receiverName = receiverNameMatch ? receiverNameMatch[1].trim() : '';

    const receiverAccountMatch = t.match(/მიმღები[\s\S]*?Account\s*Number:\s*(GE\w+)/i);
    const receiverAccount = receiverAccountMatch ? receiverAccountMatch[1].trim() : '';

    const senderNameMatch = t.match(/Sender\s*Name:\s*(.+?)(?:\s+ანგარიშის|\s+Account\s*Number)/i);
    const senderAccountMatch = t.match(/გამგზავნი[\s\S]*?Account\s*Number:\s*(GE\w+)/i);

    const accountInfo = {};
    if (senderNameMatch) accountInfo['Account Holder'] = senderNameMatch[1].trim();
    if (senderAccountMatch) accountInfo['Account Number'] = senderAccountMatch[1].trim();

    return {
        transactions: [{
            date,
            operation,
            debit: amount,
            credit: 0,
            balance: 0,
            description: operation,
            beneficiaryName: receiverName,
            beneficiaryAccount: receiverAccount,
            type: 'expense',
            amount,
            source: 'pdf',
        }],
        accountInfo: Object.keys(accountInfo).length > 0 ? accountInfo : null,
    };
}

/**
 * Parse an XLSX file into an array of transaction objects.
 * Also returns the raw CSV string for download/storage.
 */
export async function parseXLSX(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                // cellDates: true converts Excel serial numbers to JS Date objects
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });

                // Find the Transactions sheet (English + Georgian names)
                let transSheet = null;
                let accountInfo = null;

                for (const name of workbook.SheetNames) {
                    const lower = name.toLowerCase();
                    if (lower.includes('transaction') || name.includes('ტრანზაქცი')) {
                        transSheet = workbook.Sheets[name];
                    }
                    if (lower.includes('account') || lower.includes('detail')
                        || name.includes('დეტალები')) {
                        accountInfo = parseAccountDetails(workbook.Sheets[name]);
                    }
                }

                // Fallback: if no "Transactions" sheet, try the last sheet (or only sheet)
                if (!transSheet) {
                    const fallbackName = workbook.SheetNames[workbook.SheetNames.length - 1];
                    transSheet = workbook.Sheets[fallbackName];
                }

                // If account info wasn't found in a separate sheet, try extracting from the transaction sheet
                if (!accountInfo && transSheet) {
                    accountInfo = parseAccountDetails(transSheet);
                }

                // Convert to CSV with date format YYYY/MM/DD (matches parseCSV expectations)
                const csvString = XLSX.utils.sheet_to_csv(transSheet, { dateNF: 'yyyy/mm/dd' });
                const currency = accountInfo?.['Account Currency'] || null;
                const transactions = parseCSV(csvString, currency);
                resolve({ transactions, csvString, accountInfo });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse basic account details from the "Account Details" sheet.
 */
function parseAccountDetails(sheet) {
    try {
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const info = {};
        for (const row of rows) {
            if (row[0] && row[1]) {
                const rawKey = String(row[0]).replace(':', '').trim();
                info[normalizeInfoKey(rawKey)] = String(row[1]).trim();
            }
        }
        return info;
    } catch {
        return null;
    }
}

/**
 * Parse a CSV string into structured transaction objects.
 * Handles:
 *  - Comma-formatted numbers in quotes ("1,220.09")
 *  - Multiline description fields
 *  - Georgian text
 */
export function parseCSV(csvString, currency) {
    const lines = csvString.split('\n');
    const transactions = [];

    // Skip header row
    let i = 1;
    while (i < lines.length) {
        let line = lines[i].trim();
        if (!line) { i++; continue; }

        // Handle multiline quoted fields: if line has unclosed quotes,
        // join with next lines until quotes are balanced
        while (hasUnclosedQuotes(line) && i + 1 < lines.length) {
            i++;
            line += ',' + lines[i]; // join with comma (field separator was split by newline)
        }

        const fields = parseCSVLine(line);

        // Check if this is a valid row (starts with a date)
        if (!fields[0] || !/^\d{4}\/\d{2}\/\d{2}/.test(fields[0])) {
            i++;
            continue;
        }

        const date = fields[0].split(' ')[0]; // "2025/07/07"
        let operation = (fields[1] || '').trim();
        let debit = parseAmount(fields[2]);
        let credit = parseAmount(fields[3]);
        let balance = parseAmount(fields[4]);
        let description = (fields[5] || '').trim();
        let beneficiaryName = (fields[6] || '').trim();
        let beneficiaryAccount = (fields[7] || '').trim();

        // Handle multiline descriptions: if next line doesn't start with a date, it's continuation
        while (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (!nextLine || /^\d{4}\/\d{2}\/\d{2}/.test(nextLine)) break;
            // Continuation line — append to description/operation
            operation += ' ' + nextLine.replace(/,/g, '').trim();
            i++;
        }

        // Clean up operation (remove trailing whitespace/newlines)
        operation = operation.replace(/\s+/g, ' ').trim();
        description = description.replace(/\s+/g, ' ').trim();

        const type = credit > 0 ? 'income' : 'expense';

        transactions.push({
            date,
            operation,
            debit,
            credit,
            balance,
            description,
            beneficiaryName,
            beneficiaryAccount,
            type,
            amount: type === 'income' ? credit : debit,
            currency: currency || 'GEL',
        });

        i++;
    }

    return transactions;
}

/**
 * Check if a line has unclosed quotes (odd number of quote characters).
 */
function hasUnclosedQuotes(line) {
    let count = 0;
    for (const ch of line) {
        if (ch === '"') count++;
    }
    return count % 2 !== 0;
}

/**
 * Parse a single CSV line, respecting quoted fields with commas inside.
 */
function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    fields.push(current.trim());
    return fields;
}

/**
 * Parse an amount string to a number.
 * Handles: "1,220.09", "15.00", empty strings, etc.
 */
function parseAmount(str) {
    if (!str || str.trim() === '') return 0;
    // Remove thousand separators (commas) and parse
    const cleaned = str.replace(/,/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}
