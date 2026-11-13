import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { causeOf, groupByCause, readAs, ticketCause, uniqueById } from '../src/lib/kb/causes.ts';

export const root = fileURLToPath(new URL('../', import.meta.url));
const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

export function snapshot() {
  const rows = json('../src/lib/data/reports-4471.json');
  const notes = json('../src/lib/data/desk-notes.json');
  const tenants = readdirSync(new URL('../src/lib/data/tenants/', import.meta.url))
    .filter((name) => name.endsWith('.json'))
    .map((name) => json(`../src/lib/data/tenants/${name}`));
  const byHandle = new Map(tenants.map((tenant) => [tenant.handle, tenant]));
  const tenantOf = (report) => byHandle.get(report.tenant);
  const unique = uniqueById(rows);
  const reports = unique.filter((report) => report.mergedInto === 4471);
  const groups = groupByCause(reports, tenantOf);
  const weeks = new Map();
  const weekOf = (iso) => {
    const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return date.toISOString().slice(0, 10);
  };
  for (const report of reports) {
    for (const [field, counter] of [['receivedAt', 'received'], ['mergedAt', 'merged']]) {
      if (!report[field]) continue;
      const at = weekOf(report[field]);
      if (!weeks.has(at)) weeks.set(at, { at, received: 0, merged: 0 });
      weeks.get(at)[counter]++;
    }
  }
  return {
    rows, notes, tenants, tenantOf, reports, groups,
    duplicateRows: rows.length - unique.length,
    owner: ticketCause(groups, 4471),
    oneDayMoves: groups.map((group) => ({ cause: group.cause, count: readAs(group, notes.oneDayMove) })),
    weeks: [...weeks.values()].sort((a, b) => a.at.localeCompare(b.at)),
    causeById: Object.fromEntries(reports.map((report) => [report.id, causeOf(report, tenantOf(report))])),
  };
}
