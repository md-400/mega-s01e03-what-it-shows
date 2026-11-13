<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import update from '#lib/data/engineering-update.json';
  import { groupByCause, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  const groups = groupByCause(uniqueById(reports as Report[]).filter((r) => r.mergedInto === update.ticket), tenantOf);
  const outcomeFor = (cause: string) => update.outcomes[cause as keyof typeof update.outcomes];
</script>

<p>Engineering closed #{update.ticket} on <strong>{update.closedOn}</strong>, with a different outcome per cause.</p>

<table>
  <thead><tr><th>cause</th><th>unique reports</th><th>outcome</th><th>engineering evidence</th><th>GitHub closure</th></tr></thead>
  <tbody>
    {#each groups as group (group.cause)}
      {@const outcome = outcomeFor(group.cause)}
      <tr>
        <td>{group.cause}</td>
        <td>{group.reports.length}</td>
        <td><strong>{outcome?.status ?? 'needs investigation'}</strong></td>
        <td>{outcome?.detail ?? 'No engineering disposition supplied.'}</td>
        <td>
          {#if outcome}
            <a href={`https://github.com/md-400/mega-s01e03-what-it-shows/issues/${outcome.githubIssue}`}>issue {outcome.githubIssue}</a>
            — {outcome.githubReason}
          {:else}
            keep open
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<p>
  Counts are still computed from unique report IDs and tenant-aware causes in the original export.
  Closing a ticket does not remove its historical reports or combine the two causes.
</p>
