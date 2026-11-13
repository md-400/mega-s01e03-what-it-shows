# kb — the support knowledge base

**kb** = knowledge base. What the support desk knows about how our products break, written
down where the code can keep it honest.

One desk takes reports for every product we run: `sched-prod` (calendar invites for about
300k people) and the rest. When something
goes wrong, the reports reach the desk first. This kb is how the desk triages them, what each
incident turned out to be, and why we decided what we decided.

## What's here

```
src/routes/kb/      the pages (.svx: Markdown with components)
  triage/           how the desk handles incoming reports
  incidents/        one page per big ticket
  decisions/        numbered decision records
src/lib/kb/         components and the logic they run
src/lib/layouts/    the frame every page shares
src/lib/data/       exports from the ticket system
```

## Conventions

- Words in the page, logic in `src/lib` (imported as `#lib/…`). A number that can be computed belongs in a component.
- Every page starts with frontmatter: `title`, `owner`, `status`, `reviewed`.
- A decision is never edited after it is accepted. A new record replaces it.
- A page you add is signed: its frontmatter carries your `signature` and it ends with `<RenderStamp {signature} />`, so the desk knows who wrote it.

## Owners

Support desk. Decision records: whoever signed them.

---

Exported 2026-10-04 from the `support` repo, `apps/kb/` → `src/`.

## S01E03: what the export actually shows

This repository contains fictional course support data, two separately tracked problems,
and the replacement desk rule. It does not claim that either product fix has shipped.

- [Parser: 379 unique reports](https://github.com/md-400/mega-s01e03-what-it-shows/issues/1)
- [Booking-v3 hint: 33 unique reports](https://github.com/md-400/mega-s01e03-what-it-shows/issues/2)
- [Signed decision source](src/routes/kb/decisions/0002-dedupe-by-cause/+page.svx)
- [Rendered decision HTML](rendered/kb/decisions/0002-dedupe-by-cause/index.html)
- [Browser screenshot](evidence/decision-page.png)
- [Computed analysis, report IDs and weekly received/merged counts](evidence/analysis.json)

The 427 exported rows contain 412 unique report IDs. Grouping uses the original
`src/lib/kb/causes.ts`, with each tenant's configured locale/form and the report's channel,
not the browser locale or intake tag. Five one-day descriptions remain included in the
parser group under that rule, with a note preserving their wording for verification.

Decision 0002 supersedes decision 0001 without modifying that accepted historical record.
The triage page, incident summary and kb index point readers to the current rule.
New reports need continued cause-based triage; "known" and a queued fix do not mean resolved.

### Rebuild and view

Requires Node.js 24 or newer, npm, and Python 3 for this example preview server.

```sh
npm ci
npm run build
python3 -m http.server 8765 --bind 127.0.0.1 --directory rendered
```

Open <http://127.0.0.1:8765/kb/decisions/0002-dedupe-by-cause/>.
The generated HTML includes the actual server-rendered Svelte/mdsvex content and styles,
plus a local client bundle for the interactive cause explorer. Nothing requires a public host.

`npm run build` generates the audit JSON and issue-body copies, runs evidence tests, and
renders every `.svx` page with the supplied runbook layout. Counts and the desk reference
come from the supplied components at render time, not hand-written HTML.
The tests verify the exported evidence, not the live scheduling product.
The browser check and screenshot are separate captured evidence, refreshed after rendering.

### Build dependency note

`npm audit` reports three low-severity development dependency findings through
`deepmerge` and the Svelte Vite plugin/inspector, with no upstream fix available in this
installed dependency graph. The build runs locally against the supplied files; no Vite
development server is exposed publicly. Only the generated page/assets are delivered.
