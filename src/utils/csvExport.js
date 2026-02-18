function escapeCSV(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Marker line so the parser can detect this is our own export, not a bank statement
export const EXPORT_MARKER = '# CREDO-TOOL-EXPORT v1';

/**
 * Convert transactions and account info to a CSV string.
 */
export function transactionsToCSV(transactions, accountInfos = []) {
  const lines = [EXPORT_MARKER];

  for (const info of accountInfos) {
    lines.push(`Account Holder,${escapeCSV(info['Account Holder'])}`);
    lines.push(`Account Number,${escapeCSV(info['Account Number'])}`);
    lines.push(`Account Currency,${escapeCSV(info['Account Currency'])}`);
    lines.push(`Statement Period,${escapeCSV(info['Statement Period'])}`);
    lines.push(`Opening Balance,${escapeCSV(info['Opening Balance'] ?? '')}`);
    lines.push(`Closing Balance,${escapeCSV(info['Closing Balance'] ?? '')}`);
    lines.push('');
  }

  lines.push('Date,Operation,Debit,Credit,Balance,Description,Beneficiary Name,Beneficiary Account,Type,Amount,Currency');

  for (const tx of transactions) {
    lines.push([
      escapeCSV(tx.date),
      escapeCSV(tx.operation),
      tx.debit ?? '',
      tx.credit ?? '',
      tx.balance ?? '',
      escapeCSV(tx.description),
      escapeCSV(tx.beneficiaryName),
      escapeCSV(tx.beneficiaryAccount),
      escapeCSV(tx.type),
      tx.amount ?? '',
      escapeCSV(tx.currency),
    ].join(','));
  }

  return lines.join('\n');
}
