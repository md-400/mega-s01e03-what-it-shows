# Booking-v3 date hint contradicts day-first tenant parsing

## Scope and count

**33 unique reports** from original support ticket **#4471**, across **3 tenants**.
Received **2026-04-17 through 2026-09-22** in the supplied export.
Count one report per ID, not one row per export page: 427 rows contain 412 distinct reports and 15 repeated rows.

Classification uses the [original tenant-aware classifier](https://github.com/md-400/mega-s01e03-what-it-shows/blob/main/src/lib/kb/causes.ts),
[tenant configurations](https://github.com/md-400/mega-s01e03-what-it-shows/blob/main/src/lib/data/tenants), and each report's channel.
Browser locale and intake labels are guesses, not the cause rule.
The other cause has a separate GitHub issue, so these counts do not overlap.

## Evidence and reproduction

- Every report in this group arrives through a `form` for a day-first tenant running `booking-v3`.
- Affected tenant configurations: Alder Physio (`de-DE`), Copper Studio (`es-ES`), Pale Harbour (`pt-PT`).
- Booking-v3 prints `MM/DD/YYYY`, but the form reads the input using the tenant's day-first convention.
- `R-41230`: Copper Studio's form, 6 January versus 1 June, tagged `parser` by intake but classified `hint` by tenant/form/channel.
- `R-41241`: Alder Physio's form, 6 August versus 8 June. Its `en-US` browser locale does not override the tenant's `de-DE` locale.
- 15 reports in this cause were incorrectly tagged `parser` at intake.

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

## Audit trail

Run `npm ci && npm run build` on Node.js 24 or newer. The analysis executes the export's original `causes.ts`, not a replacement classifier.
See [computed counts and all report IDs](https://github.com/md-400/mega-s01e03-what-it-shows/blob/main/evidence/analysis.json),
[source reports](https://github.com/md-400/mega-s01e03-what-it-shows/blob/main/src/lib/data/reports-4471.json),
and [the signed replacement decision](https://github.com/md-400/mega-s01e03-what-it-shows/blob/main/src/routes/kb/decisions/0002-dedupe-by-cause/%2Bpage.svx).
The build tests validate the exported evidence; they do **not** run the live scheduling product or prove a fix shipped.

<details>
<summary>All 33 report IDs assigned to this cause</summary>

R-41230, R-41241, R-41251, R-41259, R-41262, R-41275, R-41294, R-41305, R-41308, R-41366, R-41372, R-41384, R-41387, R-41396, R-41400, R-41406, R-41415, R-41416, R-41418, R-41428, R-41439, R-41441, R-41449, R-41453, R-41456, R-41460, R-41472, R-41485, R-41493, R-41539, R-41572, R-41582, R-41584

</details>
