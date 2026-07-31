import { randomUUID } from 'node:crypto';

export function paginate(items, page = 1, pageSize = 20) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const start = (safePage - 1) * safePageSize;
  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total: items.length
  };
}

export function makeId() {
  return randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function cleanText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}
