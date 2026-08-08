import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOptimalSettlements } from '../src/utils/settlementSolver.js';

test('Greedy Debt Solver - Simple 2 Person Debt', () => {
  const balances = [
    { userId: 'usr-1', netBalance: -100 },
    { userId: 'usr-2', netBalance: 100 }
  ];

  const txns = calculateOptimalSettlements(balances);
  assert.equal(txns.length, 1);
  assert.equal(txns[0].payerId, 'usr-1');
  assert.equal(txns[0].payeeId, 'usr-2');
  assert.equal(txns[0].amount, 100);
});

test('Greedy Debt Solver - 4 Person Circular Debt Reduction', () => {
  // Rahul paid 8000 (net +6000), Saurabh paid 2500 (net +500), Aman paid 3200 (net +1200), Neha paid 6000 (net +4000)
  // Individual share = (8000+2500+3200+6000)/4 = 4925
  // Net Balances:
  // Rahul: 8000 - 4925 = +3075
  // Saurabh: 2500 - 4925 = -2425
  // Aman: 3200 - 4925 = -1725
  // Neha: 6000 - 4925 = +1075
  const balances = [
    { userId: 'rahul', netBalance: 3075 },
    { userId: 'saurabh', netBalance: -2425 },
    { userId: 'aman', netBalance: -1725 },
    { userId: 'neha', netBalance: 1075 }
  ];

  const txns = calculateOptimalSettlements(balances);

  // Total debited amount must equal total credited amount
  const totalSettled = txns.reduce((sum, t) => sum + t.amount, 0);
  assert.equal(totalSettled, 4150);

  // Transactions count must be <= N-1 (max 3 transactions for 4 people)
  assert.ok(txns.length <= 3);
});
