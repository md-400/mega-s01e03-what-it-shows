import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, snapshot } from './snapshot.mjs';

const data = snapshot();
const prefix = 'https://github.com/md-400/mega-s01e03-what-it-shows/blob/main/';
const common = (group) => `
## Scope and count

**${group.reports.length} unique reports** from original support ticket **#4471**, across **${group.tenants} tenants**.
Received **${group.firstSeen} through ${group.lastSeen}** in the supplied export.
Count one report per ID, not one row per export page: ${data.rows.length} rows contain ${data.reports.length} distinct reports and ${data.duplicateRows} repeated rows.

Classification uses the [original tenant-aware classifier](${prefix}src/lib/kb/causes.ts),
[tenant configurations](${prefix}src/lib/data/tenants), and each report's channel.
Browser locale and intake labels are guesses, not the cause rule.
The other cause has a separate GitHub issue, so these counts do not overlap.

## Evidence and reproduction
`;
const ids = (group) => `
## Audit trail

Run \`npm ci && npm run build\` on Node.js 24 or newer. The analysis executes the export's original \`causes.ts\`, not a replacement classifier.
See [computed counts and all report IDs](${prefix}evidence/analysis.json),
[source reports](${prefix}src/lib/data/reports-4471.json),
and [the signed replacement decision](${prefix}src/routes/kb/decisions/0002-dedupe-by-cause/%2Bpage.svx).
The build tests validate the exported evidence; they do **not** run the live scheduling product or prove a fix shipped.

<details>
<summary>All ${group.reports.length} report IDs assigned to this cause</summary>

${group.reports.map((report) => report.id).join(', ')}

</details>
`;

const parser = data.groups.find((group) => group.cause === 'parser');
const hint = data.groups.find((group) => group.cause === 'hint');
const parserBody = `# Shared parser reads day-first tenant dates month-first
${common(parser)}
- \`R-41200\`: Harbour Dental, tenant \`en-GB\`, booking-v2, app. The report says 7 April became 4 July.
- \`R-41203\`: Lantern Row, tenant \`cs-CZ\`, app. 2 December became 12 February.
- \`R-41205\`: Morrow Tax, tenant \`fr-FR\`, app. It is parser despite the \`hint\` intake tag and \`en-US\` browser locale.
- The shared parser reads every date month-first. For a day-first tenant, this reverses the intended month and day.
- ${parser.taggedAs.hint} reports in this cause were incorrectly tagged \`hint\` at intake.

**One-day descriptions:** ${parser.reports.filter((r) => data.notes.oneDayMove.includes(r.id)).map((r) => r.id).join(', ')}.
These ${data.oneDayMoves.find((g) => g.cause === 'parser').count} reports remain included in the parser count under the supplied tenant/channel rule.
Preserve and verify their wording during investigation; it does not establish a separate timezone or DST cause and must not be double-counted.

## Expected behavior and proposed fix

The shared parsing path must interpret dates according to the tenant's configured date convention,
not assume month-first or infer the tenant from the reporter's browser.
Track this cause here as the counterpart to original #4471; the separate booking-v3 hint defect is [issue 2](https://github.com/md-400/mega-s01e03-what-it-shows/issues/2).

## Acceptance checks for the product fix

- [ ] Reproduce the cited ambiguous dates on the relevant day-first tenant/channel paths.
- [ ] Tenant-intended dates such as 07/04 retain 7 April; cover both reversal directions and days above 12.
- [ ] Cover app, email and affected booking-v2 form paths, and booking-v3 non-form paths.
- [ ] Keep month-first tenants correct and preserve the five one-day reports for targeted verification.
- [ ] Record the deployed fix and regression results; a known/queued status is not proof of resolution.
${ids(parser)}`;

const hintBody = `# Booking-v3 date hint contradicts day-first tenant parsing
${common(hint)}
- Every report in this group arrives through a \`form\` for a day-first tenant running \`booking-v3\`.
- Affected tenant configurations: Alder Physio (\`de-DE\`), Copper Studio (\`es-ES\`), Pale Harbour (\`pt-PT\`).
- Booking-v3 prints \`MM/DD/YYYY\`, but the form reads the input using the tenant's day-first convention.
- \`R-41230\`: Copper Studio's form, 6 January versus 1 June, tagged \`parser\` by intake but classified \`hint\` by tenant/form/channel.
- \`R-41241\`: Alder Physio's form, 6 August versus 8 June. Its \`en-US\` browser locale does not override the tenant's \`de-DE\` locale.
- ${hint.taggedAs.parser} reports in this cause were incorrectly tagged \`parser\` at intake.

## Expected behavior and proposed fix

The date field's visible hint must agree with the form's parsing convention for the configured tenant.
Align the booking-v3 hint and validation with day-first tenant input; verify accessibility/help text too.
This is a misleading UI instruction, not the shared parser's month-first assumption.
The parser cause is [issue 1](https://github.com/md-400/mega-s01e03-what-it-shows/issues/1);
shipping that fix alone does not resolve this hint mismatch.

## Acceptance checks for the product fix

- [ ] Reproduce on booking-v3 for Alder Physio, Copper Studio and Pale Harbour with an ambiguous date.
- [ ] Render a tenant-correct hint and validate/parse the same format; typing the displayed format preserves the intended day.
- [ ] Cover ambiguous dates in both directions and dates with a day above 12.
- [ ] Check booking-v2 remains correct and non-form/parser paths stay tracked separately.
- [ ] Record the deployed fix and regression results before marking this cause fixed.
${ids(hint)}`;

mkdirSync(resolve(root, 'evidence/issues'), { recursive: true });
writeFileSync(resolve(root, 'evidence/issues/parser.md'), parserBody);
writeFileSync(resolve(root, 'evidence/issues/hint.md'), hintBody);
console.log(`Prepared parser (${parser.reports.length}) and hint (${hint.reports.length}) issue bodies.`);
