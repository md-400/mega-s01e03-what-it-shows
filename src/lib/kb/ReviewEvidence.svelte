<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, readAs, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  const rows = reports as Report[];
  const unique = uniqueById(rows);
  const merged = unique.filter((r) => r.mergedInto === 4471);
  const groups = groupByCause(merged, tenantOf);
  const parser = groups.find((g) => g.cause === 'parser');
  const hint = groups.find((g) => g.cause === 'hint');
  const misfiled = groups.reduce((n, g) => n + g.reports.filter((r) => r.meta.intakeTag !== g.cause).length, 0);
</script>

<p>
  The export has <strong>{rows.length}</strong> rows and <strong>{merged.length}</strong> unique reports
  merged into #4471. Its overlapping pages repeat <strong>{rows.length - unique.length}</strong> rows.
  Deduplicate by report ID before grouping or counting.
</p>

<ul>
  <li>
    <a href="https://github.com/md-400/mega-s01e03-what-it-shows/issues/1">Parser ticket</a>:
    <strong>{parser?.reports.length ?? 0} reports</strong>, across {parser?.tenants ?? 0} tenants.
    The shared parser treats a day-first tenant's date as month-first.
    This is the majority cause that the original #4471 describes.
  </li>
  <li>
    <a href="https://github.com/md-400/mega-s01e03-what-it-shows/issues/2">Booking-v3 hint ticket</a>:
    <strong>{hint?.reports.length ?? 0} reports</strong>, across {hint?.tenants ?? 0} tenants.
    Booking-v3 prints MM/DD/YYYY but its form interprets the input in the tenant's day-first locale.
    This needs its own fix, separate from the shared parser.
  </li>
</ul>

<p>
  Intake guessed the wrong cause on <strong>{misfiled}</strong> reports:
  {parser?.taggedAs.hint ?? 0} parser reports were tagged hint, and
  {hint?.taggedAs.parser ?? 0} hint reports were tagged parser.
  The browser locale and intake tag do not establish the tenant's configuration.
</p>

{#each groups as group (group.cause)}
  {@const moved = readAs(group, notes.oneDayMove)}
  {#if moved}
    <p>
      <strong>{moved}</strong> reports describe a one-day move, but remain counted under
      <code>{group.cause}</code> by the kb's tenant/channel rule:
      {notes.oneDayMove.filter((id) => group.reports.some((r) => r.id === id)).join(', ')}.
      This description alone does not prove a timezone or DST defect; do not invent a third cause
      or count these reports twice. Preserve their wording for verification during the fix.
    </p>
  {/if}
{/each}
