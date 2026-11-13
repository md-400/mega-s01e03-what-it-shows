import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, snapshot } from './snapshot.mjs';

const data = snapshot();
const analysis = {
  source: 'src/lib/data/reports-4471.json; original src/lib/kb/causes.ts and tenant files',
  exportRows: data.rows.length,
  uniqueReports: data.reports.length,
  duplicateRows: data.duplicateRows,
  ticket: 4471,
  ticketCause: data.owner,
  groups: data.groups.map((group) => ({
    cause: group.cause,
    count: group.reports.length,
    tenants: group.tenants,
    firstSeen: group.firstSeen,
    lastSeen: group.lastSeen,
    intakeTags: group.taggedAs,
    oneDayMove: data.notes.oneDayMove.filter((id) => group.reports.some((report) => report.id === id)),
    reportIds: group.reports.map((report) => report.id),
  })),
  weeks: data.weeks,
};
mkdirSync(resolve(root, 'evidence'), { recursive: true });
writeFileSync(resolve(root, 'evidence/analysis.json'), `${JSON.stringify(analysis, null, 2)}\n`);
console.log(`Export rows: ${analysis.exportRows}; unique reports: ${analysis.uniqueReports}; repeated rows: ${analysis.duplicateRows}`);
for (const group of analysis.groups) {
  console.log(`${group.cause}: ${group.count} reports, ${group.tenants} tenants, ${group.firstSeen} to ${group.lastSeen}; one-day descriptions: ${group.oneDayMove.length}`);
}
console.log(`Original #4471 owns the ${analysis.ticketCause} cause; intake labels are not classification evidence.`);
