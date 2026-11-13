import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { causeOf, dayFirst, sameCause, uniqueById } from '../src/lib/kb/causes.ts';
import { DEDUPE_CASES } from '../src/lib/kb/dedupe-cases.ts';
import { deskRef } from '../src/lib/kb/desk-ref.ts';
import { snapshot } from './snapshot.mjs';

const data = snapshot();

test('overlapping export pages count each report ID once', () => {
  assert.equal(data.rows.length, 427);
  assert.equal(data.reports.length, 412);
  assert.equal(data.duplicateRows, 15);
  assert.equal(uniqueById(data.rows).length, 412);
  for (const row of data.rows) {
    const repeated = data.rows.filter((r) => r.id === row.id);
    assert.ok(repeated.every((r) => JSON.stringify(r) === JSON.stringify(row)), `conflicting copy: ${row.id}`);
  }
});

test('tenant configuration, not intake tags, gives the two cause counts', () => {
  assert.deepEqual(data.groups.map((g) => [g.cause, g.reports.length]), [['parser', 379], ['hint', 33]]);
  assert.equal(data.owner, 'parser');
  assert.equal(data.groups.reduce((total, g) => total + g.reports.length, 0), 412);
  assert.ok(data.tenants.every((tenant) => dayFirst(tenant.locale)));
  const parser = data.groups.find((g) => g.cause === 'parser');
  const hint = data.groups.find((g) => g.cause === 'hint');
  assert.equal(parser.taggedAs.hint, 23);
  assert.equal(hint.taggedAs.parser, 15);
  assert.ok(hint.reports.every((r) => r.channel === 'form' && data.tenantOf(r).form === 'booking-v3'));
});

test('one-day descriptions remain in their cause group, without a third invented bug', () => {
  assert.deepEqual(data.oneDayMoves, [{ cause: 'parser', count: 5 }, { cause: 'hint', count: 0 }]);
  for (const id of data.notes.oneDayMove) assert.equal(data.causeById[id], 'parser');
});

test('cause matching rejects subject matches and accepts cross-channel duplicates', () => {
  assert.deepEqual(DEDUPE_CASES.map((c) => sameCause(c.a, data.tenantOf(c.a), c.b, data.tenantOf(c.b))), [true, false, false, true, false]);
  assert.equal(causeOf({ channel: 'email' }, undefined), null);
  assert.equal(causeOf({ channel: 'email' }, { locale: 'en-US', form: 'booking-v2' }), null);
});

test('received dates distinguish incident onset from the July backlog merge', () => {
  const july = data.weeks.find((week) => week.at === '2026-06-29');
  assert.equal(july.received, 15);
  assert.equal(july.merged, 189);
  assert.equal(data.groups.find((g) => g.cause === 'parser').firstSeen, '2026-04-01');
  assert.equal(data.groups.find((g) => g.cause === 'hint').firstSeen, '2026-04-17');
  assert.equal(data.weeks.reduce((n, w) => n + w.received, 0), 412);
  assert.equal(data.weeks.reduce((n, w) => n + w.merged, 0), 412);
});

test('desk reference is derived by the original code from the page signature', () => {
  const page = readFileSync(new URL('../src/routes/kb/decisions/0002-dedupe-by-cause/+page.svx', import.meta.url), 'utf8');
  const signature = page.match(/^signature: '([^']+)'$/m)?.[1];
  assert.ok(signature);
  assert.match(deskRef(signature), /^DR-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  assert.ok(page.trim().endsWith('<RenderStamp {signature} />'));
});

test('engineering dispositions distinguish a fixed parser from an unfixed retired form', () => {
  const update = JSON.parse(readFileSync(new URL('../src/lib/data/engineering-update.json', import.meta.url), 'utf8'));
  assert.equal(update.closedOn, '2026-10-05');
  assert.equal(update.outcomes.parser.status, 'FIXED');
  assert.equal(update.outcomes.parser.githubReason, 'completed');
  assert.equal(update.outcomes.hint.status, "WON'T FIX");
  assert.equal(update.outcomes.hint.githubReason, 'not planned');
  assert.equal(update.outcomes.hint.detail, 'booking-v3 form retired');
});
