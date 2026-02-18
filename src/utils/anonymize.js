import { categorize } from './analytics';

/**
 * Anonymize transactions for report submission.
 * Preserves: date, debit, credit, balance, amount, currency, type
 * Replaces personal details with generic labels.
 */
export function anonymizeTransactions(transactions) {
  return transactions.map(tx => {
    const cat = categorize(tx);
    return {
      date: tx.date,
      operation: `[${cat.name}]`,
      debit: tx.debit,
      credit: tx.credit,
      balance: tx.balance,
      description: `[${cat.name}]`,
      beneficiaryName: tx.beneficiaryName ? 'ANON_BENEFICIARY' : '',
      beneficiaryAccount: tx.beneficiaryAccount
        ? tx.beneficiaryAccount.replace(/[A-Za-z0-9]/g, '0')
        : '',
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
    };
  });
}

/**
 * Anonymize account info for report submission.
 * Replaces holder name, account number, and ID number.
 */
export function anonymizeAccountInfos(accountInfos) {
  return accountInfos.map(info => ({
    'Account Holder': 'ANONIMUS USER',
    'Account Number': info['Account Number']
      ? info['Account Number'].replace(/[A-Za-z0-9]/g, '0')
      : '',
    'Account Currency': info['Account Currency'] || '',
    'Statement Period': info['Statement Period'] || '',
    'Opening Balance': info['Opening Balance'] ?? '',
    'Closing Balance': info['Closing Balance'] ?? '',
    'Identification Number': '00000000000',
  }));
}
