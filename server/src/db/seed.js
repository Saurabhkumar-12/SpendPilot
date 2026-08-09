import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, initDatabase } from './database.js';

export async function seedDatabase() {
  initDatabase();

  // Clear existing collections
  const collections = [
    'users', 'user_preferences', 'sessions', 'custom_categories',
    'groups', 'group_members', 'personal_expenses', 'group_expenses',
    'expense_splits', 'settlements', 'notifications', 'audit_logs', 'feedback'
  ];

  collections.forEach(col => {
    db.remove(col, () => true);
  });

  console.log('Seeding demo data into SpendPilot...');

  const passHash = await bcrypt.hash('Password123!', 10);

  const rahul = { id: 'usr-rahul', name: 'Rahul Sharma', email: 'rahul@spendpilot.com', password_hash: passHash, is_verified: 1, created_at: new Date().toISOString() };
  const abc = { id: 'usr-abc', name: 'ABC', email: 'abc@spendpilot.com', password_hash: passHash, is_verified: 1, created_at: new Date().toISOString() };
  const aman = { id: 'usr-aman', name: 'Aman Gupta', email: 'aman@spendpilot.com', password_hash: passHash, is_verified: 1, created_at: new Date().toISOString() };
  const neha = { id: 'usr-neha', name: 'Neha Singh', email: 'neha@spendpilot.com', password_hash: passHash, is_verified: 1, created_at: new Date().toISOString() };

  [rahul, abc, aman, neha].forEach(u => db.insert('users', u));

  [rahul, abc, aman, neha].forEach(u => {
    db.insert('user_preferences', {
      user_id: u.id,
      currency: '₹',
      theme: 'light',
      default_split_mode: 'EQUAL',
      notify_invites: 1,
      notify_settlements: 1
    });
  });

  // Personal Expenses for Rahul
  const personal = [
    { id: 'exp-1', user_id: rahul.id, amount: 450, category: 'Food', description: 'Lunch at Cafe Bistro', date: '2026-08-05', payment_method: 'UPI', created_at: new Date().toISOString() },
    { id: 'exp-2', user_id: rahul.id, amount: 1200, category: 'Fuel', description: 'Petrol fill up', date: '2026-08-04', payment_method: 'Credit Card', created_at: new Date().toISOString() },
    { id: 'exp-3', user_id: rahul.id, amount: 3500, category: 'Shopping', description: 'Running shoes purchase', date: '2026-08-02', payment_method: 'UPI', created_at: new Date().toISOString() },
    { id: 'exp-4', user_id: rahul.id, amount: 12000, category: 'Rent', description: 'Monthly room rent share', date: '2026-08-01', payment_method: 'Net Banking', created_at: new Date().toISOString() }
  ];
  personal.forEach(e => db.insert('personal_expenses', e));

  // Create Group: Goa Trip
  const goaGroup = {
    id: 'grp-goa',
    name: 'Goa Trip 2026',
    description: 'Baga beach resort, water sports & dinners',
    group_type: 'Trip',
    created_by: rahul.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.insert('groups', goaGroup);

  // Group Members
  [
    { id: 'gm-1', group_id: goaGroup.id, user_id: rahul.id, role: 'ADMIN' },
    { id: 'gm-2', group_id: goaGroup.id, user_id: abc.id, role: 'MEMBER' },
    { id: 'gm-3', group_id: goaGroup.id, user_id: aman.id, role: 'MEMBER' },
    { id: 'gm-4', group_id: goaGroup.id, user_id: neha.id, role: 'MEMBER' }
  ].forEach(m => db.insert('group_members', m));

  const groupExpensesData = [
    { id: 'gexp-1', paidById: rahul.id, amount: 8000, category: 'Rent', description: 'Baga Beach Hotel Stay', date: '2026-08-03' },
    { id: 'gexp-2', paidById: abc.id, amount: 2500, category: 'Fuel', description: 'Car Fuel & Highway Tolls', date: '2026-08-03' },
    { id: 'gexp-3', paidById: aman.id, amount: 3200, category: 'Food', description: 'Seafood Dinner at Shack', date: '2026-08-04' },
    { id: 'gexp-4', paidById: neha.id, amount: 6000, category: 'Entertainment', description: 'Water Sports & Scuba Tickets', date: '2026-08-05' }
  ];

  const totalMembers = 4;

  groupExpensesData.forEach(eData => {
    const expenseId = eData.id;
    db.insert('group_expenses', {
      id: expenseId,
      group_id: goaGroup.id,
      paid_by_id: eData.paidById,
      amount: eData.amount,
      category: eData.category,
      description: eData.description,
      date: eData.date,
      split_type: 'EQUAL',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const share = eData.amount / totalMembers;

    [rahul.id, abc.id, aman.id, neha.id].forEach(uId => {
      db.insert('expense_splits', {
        id: crypto.randomUUID(),
        expense_id: expenseId,
        user_id: uId,
        amount_owed: share,
        percentage: 25,
        created_at: new Date().toISOString()
      });
    });
  });

  console.log('Database seeded successfully!');
}
