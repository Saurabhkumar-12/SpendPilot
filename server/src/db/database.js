import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const collections = [
  'users',
  'user_preferences',
  'sessions',
  'custom_categories',
  'groups',
  'group_members',
  'personal_expenses',
  'group_expenses',
  'expense_splits',
  'settlements',
  'notifications',
  'audit_logs',
  'feedback'
];

// Initialize JSON files if missing
collections.forEach(col => {
  const filePath = path.join(dataDir, `${col}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]), 'utf8');
  }
});

function getFilePath(col) {
  return path.join(dataDir, `${col}.json`);
}

export function readCollection(col) {
  try {
    const filePath = getFilePath(col);
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Error reading collection ${col}:`, err);
    return [];
  }
}

export function writeCollection(col, data) {
  try {
    const filePath = getFilePath(col);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing collection ${col}:`, err);
  }
}

export const db = {
  find(col, filterFn = () => true) {
    const items = readCollection(col);
    return items.filter(filterFn);
  },

  findOne(col, filterFn) {
    const items = readCollection(col);
    return items.find(filterFn) || null;
  },

  insert(col, item) {
    const items = readCollection(col);
    items.push(item);
    writeCollection(col, items);
    return item;
  },

  update(col, filterFn, updateData) {
    const items = readCollection(col);
    let updatedCount = 0;
    const newItems = items.map(item => {
      if (filterFn(item)) {
        updatedCount++;
        return typeof updateData === 'function' ? updateData(item) : { ...item, ...updateData };
      }
      return item;
    });
    writeCollection(col, newItems);
    return updatedCount;
  },

  remove(col, filterFn) {
    const items = readCollection(col);
    const initialLen = items.length;
    const newItems = items.filter(item => !filterFn(item));
    writeCollection(col, newItems);
    return initialLen - newItems.length;
  }
};

export function initDatabase() {
  console.log('Database initialized with collections:', collections.join(', '));
}
