import {
  type AttemptAnalysis,
  type FlakeReport,
  type RunAnalysis,
  type RunVerdict,
  type TestAnalysis,
} from './types'

const VERDICT_LABELS: Record<RunVerdict, string> = {
  'mixed': 'Mixed (platform + test-side)',
  'platform': 'Platform / network degraded',
  'test-side': 'API healthy at failure (test or app bug)',
  'unknown': 'Unknown (no diagnostics data)',
}

function formatTime(iso: string): string {
  return iso.replace('T', ' ').replace(/:\d{2}(\.\d+)?Z$/, 'Z')
}

function percent(part: number, total: number): string {
  return total === 0 ? '–' : `${Math.round((part / total) * 100)}%`
}

function escapeCell(text: string): string {
  return text.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function runLink(analysis: RunAnalysis): string {
  const {run} = analysis
  const label = run.prNumber ? `#${run.prNumber}` : run.branch
  return `[${escapeCell(label)}](${run.url})`
}

function allAttempts(failed: RunAnalysis[]): {attempt: AttemptAnalysis; test: TestAnalysis}[] {
  return failed.flatMap((analysis) =>
    analysis.tests.flatMap((test) => test.attempts.map((attempt) => ({attempt, test}))),
  )
}

export function renderMarkdown(report: FlakeReport): string {
  const completed = report.runs.filter((run) => run.status === 'completed')
  const byConclusion = (conclusion: string) =>
    completed.filter((run) => run.conclusion === conclusion).length
  const failedCount = byConclusion('failure')
  const verdictCounts = Object.fromEntries(
    (Object.keys(VERDICT_LABELS) as RunVerdict[]).map((verdict) => [
      verdict,
      report.failed.filter((analysis) => analysis.verdict === verdict).length,
    ]),
  ) as Record<RunVerdict, number>
  const withData = report.failed.filter((analysis) => analysis.verdict !== 'unknown').length

  const lines: string[] = []
  lines.push(`# E2E flake report`)
  lines.push('')
  lines.push(
    `Workflow **${report.workflow}** in \`${report.repo}\`, runs created ${formatTime(report.since)} → ${formatTime(report.until)} (generated ${formatTime(report.generatedAt)}).`,
  )
  lines.push('')
  lines.push(
    `**${completed.length} completed runs**: ${byConclusion('success')} passed, ${failedCount} failed, ${byConclusion('cancelled')} cancelled. ${report.runs.length - completed.length} still running.`,
  )
  lines.push('')

  lines.push(`## Why did the ${failedCount} failed runs fail?`)
  lines.push('')
  lines.push('| Verdict | Runs | Share of failures | Share of failures with data |')
  lines.push('| --- | ---: | ---: | ---: |')
  for (const verdict of Object.keys(VERDICT_LABELS) as RunVerdict[]) {
    const count = verdictCounts[verdict]
    lines.push(
      `| ${VERDICT_LABELS[verdict]} | ${count} | ${percent(count, failedCount)} | ${verdict === 'unknown' ? '–' : percent(count, withData)} |`,
    )
  }
  lines.push('')
  const platformShare = verdictCounts.platform + verdictCounts.mixed
  lines.push(
    `Of the ${withData} failed runs with diagnostics data, **${platformShare} (${percent(platformShare, withData)}) show API degradation** on the failing attempt (platform or mixed). ` +
      `Coverage caveat: diagnostics attachments only exist for runs on branches that include the failure-diagnostics fixture; older runs land in "unknown".`,
  )
  lines.push('')

  lines.push('## Correlated failure windows')
  lines.push('')
  if (report.clusters.length === 0) {
    lines.push(
      `No window with ≥${report.thresholds.clusterMinRuns} failed runs across ≥${report.thresholds.clusterMinBranches} branches within ${report.thresholds.clusterGapMs / 60_000} minutes of each other.`,
    )
  } else {
    lines.push(
      `Failed runs on unrelated branches landing within ${report.thresholds.clusterGapMs / 60_000} minutes of each other cannot be explained by any single PR's code.`,
    )
    lines.push('')
    lines.push('| Window (UTC) | Failed runs | Distinct branches | Verdicts |')
    lines.push('| --- | ---: | ---: | --- |')
    for (const cluster of report.clusters) {
      const verdicts = cluster.runs.map((analysis) => analysis.verdict)
      const counts = (['platform', 'mixed', 'test-side', 'unknown'] as RunVerdict[])
        .map((verdict) => [verdict, verdicts.filter((item) => item === verdict).length] as const)
        .filter(([, count]) => count > 0)
        .map(([verdict, count]) => `${count} ${verdict}`)
        .join(', ')
      lines.push(
        `| ${formatTime(cluster.start)} → ${formatTime(cluster.end)} | ${cluster.runs.length} | ${cluster.branches.length} | ${counts} |`,
      )
    }
  }
  lines.push('')

  lines.push('## Failed runs')
  lines.push('')
  if (report.failed.length === 0) {
    lines.push('No failed runs in the window.')
  } else {
    lines.push('| When (UTC) | Run | Title | Failed jobs | Verdict | Evidence |')
    lines.push('| --- | --- | --- | --- | --- | --- |')
    for (const analysis of [...report.failed].sort((left, right) =>
      right.run.createdAt.localeCompare(left.run.createdAt),
    )) {
      const jobs = analysis.failedJobs.map((job) => job.replace('playwright-test ', '')).join(', ')
      lines.push(
        `| ${formatTime(analysis.run.createdAt)} | ${runLink(analysis)} | ${escapeCell(analysis.run.title.slice(0, 60))} | ${escapeCell(jobs)} | ${analysis.verdict} | ${escapeCell(analysis.reasons.slice(0, 3).join(' • '))} |`,
      )
    }
  }
  lines.push('')

  const attempts = allAttempts(report.failed)
  const captured = attempts.filter(({attempt}) => attempt.verdict !== 'unknown')
  lines.push('## What the diagnostics captures show')
  lines.push('')
  lines.push(
    `${attempts.length} failed test attempts in failed runs, ${captured.length} with a diagnostics capture (${attempts.filter(({attempt}) => attempt.kind === 'studio').length} full studio reports, ${attempts.filter(({attempt}) => attempt.kind === 'fallback').length} fallback probe reports).`,
  )
  lines.push('')
  if (captured.length > 0) {
    const degraded = captured.filter(({attempt}) => attempt.verdict === 'degraded')
    lines.push(
      `- **${degraded.length} of ${captured.length} captured attempts (${percent(degraded.length, captured.length)}) saw a degraded API**; ${captured.length - degraded.length} saw a healthy API.`,
    )

    const flaky = captured.filter(({test}) => test.outcome === 'flaky')
    const flakyDegraded = flaky.filter(({attempt}) => attempt.verdict === 'degraded')
    lines.push(
      `- Flaky attempts (failed, then passed on retry): ${flaky.length}, of which ${flakyDegraded.length} degraded.`,
    )

    const shards = new Map<string, {count: number; degraded: number}>()
    for (const {attempt} of captured) {
      const shard =
        attempt.diagnostics?.network.shard ??
        attempt.fallback?.probes.find((probe) => probe.shard)?.shard ??
        'unknown shard'
      const entry = shards.get(shard) ?? {count: 0, degraded: 0}
      entry.count += 1
      if (attempt.verdict === 'degraded') entry.degraded += 1
      shards.set(shard, entry)
    }
    lines.push(
      `- API shards seen: ${[...shards.entries()]
        .sort((left, right) => right[1].count - left[1].count)
        .map(
          ([shard, entry]) => `\`${shard}\` (${entry.count} captures, ${entry.degraded} degraded)`,
        )
        .join(', ')}.`,
    )

    const reasons = new Map<string, number>()
    for (const {attempt} of degraded) {
      for (const reason of attempt.evidence) {
        const key = reason
          .replace(/\d+(\.\d+)? ms/g, 'N ms')
          .replace(/over \d+ requests/, 'over N requests')
        reasons.set(key, (reasons.get(key) ?? 0) + 1)
      }
    }
    if (reasons.size > 0) {
      lines.push('- Most common degradation signals:')
      for (const [reason, count] of [...reasons.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 8)) {
        lines.push(`  - ${count}× ${reason}`)
      }
    }

    const hours = new Map<number, number>()
    for (const {attempt} of degraded) {
      const at = attempt.diagnostics?.startedAt ?? attempt.fallback?.generatedAt
      if (!at) continue
      const hour = new Date(at).getUTCHours()
      hours.set(hour, (hours.get(hour) ?? 0) + 1)
    }
    if (hours.size > 0) {
      lines.push(
        `- Degraded captures by hour (UTC): ${[...hours.entries()]
          .sort((left, right) => left[0] - right[0])
          .map(([hour, count]) => `${String(hour).padStart(2, '0')}h ×${count}`)
          .join(', ')}.`,
      )
    }
  }
  lines.push('')

  const specCounts = new Map<string, {failed: number; flaky: number; degraded: number}>()
  for (const analysis of report.failed) {
    for (const test of analysis.tests) {
      const spec = test.title.split(' › ')[0] ?? test.title
      const entry = specCounts.get(spec) ?? {failed: 0, flaky: 0, degraded: 0}
      if (test.outcome === 'failed') entry.failed += 1
      else entry.flaky += 1
      if (test.attempts.some((attempt) => attempt.verdict === 'degraded')) entry.degraded += 1
      specCounts.set(spec, entry)
    }
  }
  if (specCounts.size > 0) {
    lines.push('## Specs involved in failed runs')
    lines.push('')
    lines.push('| Spec | Hard failures | Flaky | Saw degraded API |')
    lines.push('| --- | ---: | ---: | ---: |')
    for (const [spec, entry] of [...specCounts.entries()].sort(
      (left, right) => right[1].failed + right[1].flaky - (left[1].failed + left[1].flaky),
    )) {
      lines.push(`| \`${spec}\` | ${entry.failed} | ${entry.flaky} | ${entry.degraded} |`)
    }
    lines.push('')
  }

  const {thresholds} = report
  lines.push('## Method')
  lines.push('')
  lines.push(
    `Each failed or timed-out test attempt attaches the Studio Diagnostics report (\`studio-diagnostics.json\`) captured from the failing browser; when the studio never mounted, plain-fetch probes are attached instead. An attempt counts as **degraded** when any probe or listen check fails or times out, a probe exceeds ${thresholds.slowProbeMs} ms, any recorded request exceeds ${thresholds.slowRequestMs} ms, a request bucket with ≥${thresholds.minSampleForPercentiles} samples has a median over ${thresholds.slowMedianMs} ms or a p95 over ${thresholds.slowP95Ms} ms, ${thresholds.historyErrorCount}+ requests failed during the test, or a fallback probe returned 429/5xx.`,
  )
  lines.push('')
  lines.push(
    'A run is **platform** when every hard-failed test shows a degraded API on its final attempt (or the failing setup job hit a rate limit / network error), **test-side** when every final attempt saw a healthy API, **mixed** otherwise, and **unknown** when no diagnostics were captured. Flaky tests (failed then passed) never fail a run and are reported separately.',
  )
  lines.push('')
  return lines.join('\n')
}
