/**
 * Greedy Debt Simplification Graph Algorithm
 * Reduces N(N-1) directional debts into the minimal number of settlement transactions.
 * 
 * @param {Array<{userId: string, netBalance: number}>} memberBalances 
 * @returns {Array<{payerId: string, payeeId: string, amount: number}>}
 */
export function calculateOptimalSettlements(memberBalances) {
  const debtors = [];
  const creditors = [];

  // Round balances to 2 decimal places to avoid floating point precision artifacts
  memberBalances.forEach(m => {
    const val = Math.round((m.netBalance || 0) * 100) / 100;
    if (val < -0.01) {
      debtors.push({ userId: m.userId, amount: Math.abs(val) });
    } else if (val > 0.01) {
      creditors.push({ userId: m.userId, amount: val });
    }
  });

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settledAmount = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = Math.round(settledAmount * 100) / 100;

    if (roundedAmount > 0) {
      transactions.push({
        payerId: debtor.userId,
        payeeId: creditor.userId,
        amount: roundedAmount
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
}
