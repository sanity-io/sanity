import {BarChartIcon} from '@sanity/icons/BarChart'
import {StackCompactIcon} from '@sanity/icons/StackCompact'
import {TrendUpwardIcon} from '@sanity/icons/TrendUpward'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Schema for the `benchRun` documents written by the perf/bench track-main
 * cron (`pnpm bench:store`). The shape mirrors perf/bench/report/types.ts as
 * reshaped for storage by perf/bench/report/storeShape.ts (nested sample
 * arrays wrapped in `{samples}` objects, `byClass` records as keyed arrays).
 * Documents are machine-written — the studio presents, it does not edit.
 */

const summaryStatsFields = [
  defineField({name: 'n', type: 'number'}),
  defineField({name: 'median', type: 'number'}),
  defineField({name: 'p75', type: 'number'}),
  defineField({name: 'p90', type: 'number'}),
  defineField({name: 'p99', type: 'number'}),
  defineField({name: 'min', type: 'number'}),
  defineField({name: 'max', type: 'number'}),
]

const benchSideMetric = defineType({
  name: 'benchSideMetric',
  title: 'Side metric',
  type: 'object',
  fields: [
    defineField({
      name: 'sessions',
      description: 'Per-session sample arrays (session = bootstrap resampling unit)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'session',
          fields: [
            defineField({
              name: 'samples',
              type: 'array',
              of: [defineArrayMember({type: 'number'})],
            }),
          ],
        }),
      ],
    }),
    defineField({name: 'summary', type: 'object', fields: summaryStatsFields}),
  ],
})

const benchMetric = defineType({
  name: 'benchMetric',
  title: 'Metric',
  type: 'object',
  icon: TrendUpwardIcon,
  fields: [
    defineField({name: 'label', type: 'string'}),
    defineField({name: 'unit', type: 'string'}),
    defineField({
      name: 'presentAsEfps',
      description: 'Present the median as eFPS (1000/ms) in reports',
      type: 'boolean',
    }),
    defineField({name: 'experiment', type: 'benchSideMetric'}),
    defineField({name: 'reference', type: 'benchSideMetric'}),
    defineField({
      name: 'comparison',
      type: 'object',
      fields: [
        defineField({name: 'diff', type: 'number'}),
        defineField({name: 'lo', type: 'number'}),
        defineField({name: 'hi', type: 'number'}),
        defineField({
          name: 'verdict',
          type: 'string',
          options: {list: ['regression', 'improvement', 'neutral', 'inconclusive']},
        }),
      ],
    }),
  ],
  preview: {
    select: {label: 'label', verdict: 'comparison.verdict', median: 'experiment.summary.median'},
    prepare: ({label, verdict, median}) => ({
      title: label,
      subtitle: [
        typeof median === 'number' ? `p50 ${median.toFixed(0)}ms` : null,
        verdict ?? 'no comparison',
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})

const interruptionCountFields = [
  defineField({name: 'count', type: 'number'}),
  defineField({name: 'totalMs', type: 'number'}),
]

const benchResourceSide = defineType({
  name: 'benchResourceSide',
  title: 'Resource usage (per-session medians)',
  type: 'object',
  fields: [
    defineField({name: 'requestCount', type: 'number'}),
    defineField({name: 'requestBytes', type: 'number'}),
    defineField({
      name: 'byClass',
      description: 'Median request count per endpoint class',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'classCount',
          fields: [
            defineField({name: 'endpointClass', type: 'string'}),
            defineField({name: 'count', type: 'number'}),
          ],
          preview: {select: {title: 'endpointClass', subtitle: 'count'}},
        }),
      ],
    }),
    defineField({name: 'cpuTaskMs', type: 'number'}),
    defineField({name: 'cpuScriptMs', type: 'number'}),
    defineField({name: 'heapMb', type: 'number'}),
    defineField({name: 'domNodes', type: 'number'}),
    defineField({name: 'listeners', type: 'number'}),
  ],
})

const benchScenario = defineType({
  name: 'benchScenario',
  title: 'Scenario report',
  type: 'object',
  icon: StackCompactIcon,
  fields: [
    defineField({name: 'scenario', type: 'string'}),
    defineField({name: 'sourceFile', type: 'string'}),
    defineField({
      name: 'runner',
      description:
        'Host-speed calibration of the shard runner that produced this scenario (CI runs one shard per scenario on separate machines); absent on single-shard/local runs',
      type: 'object',
      fields: [
        defineField({
          name: 'calibrationMs',
          description: 'Host-speed score (ms for a fixed workload; higher = slower host)',
          type: 'number',
        }),
      ],
    }),
    defineField({name: 'kind', type: 'string', options: {list: ['interaction', 'pageload']}}),
    defineField({name: 'metrics', type: 'array', of: [defineArrayMember({type: 'benchMetric'})]}),
    defineField({
      name: 'stoppedBy',
      description: 'Why A/B sampling stopped (absent in absolute mode)',
      type: 'string',
      options: {list: ['converged', 'budget', 'max-sessions']},
    }),
    defineField({
      name: 'failures',
      description: 'Discarded-and-retried sessions — the flake telemetry',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'failure',
          fields: [
            defineField({
              name: 'side',
              type: 'string',
              options: {list: ['reference', 'experiment']},
            }),
            defineField({name: 'reason', type: 'string'}),
          ],
          preview: {select: {title: 'reason', subtitle: 'side'}},
        }),
      ],
    }),
    defineField({
      name: 'interruptions',
      description: 'Read-only interruption totals mid-typing',
      type: 'object',
      fields: [
        defineField({name: 'experiment', type: 'object', fields: interruptionCountFields}),
        defineField({name: 'reference', type: 'object', fields: interruptionCountFields}),
      ],
    }),
    defineField({
      name: 'loafAttribution',
      description: 'Top blocking-script attributions (experiment side)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'attribution',
          fields: [
            defineField({name: 'sourceUrl', type: 'string'}),
            defineField({name: 'functionName', type: 'string'}),
            defineField({name: 'totalMs', type: 'number'}),
          ],
          preview: {select: {title: 'functionName', subtitle: 'sourceUrl'}},
        }),
      ],
    }),
    defineField({
      name: 'resources',
      type: 'object',
      fields: [
        defineField({name: 'experiment', type: 'benchResourceSide'}),
        defineField({name: 'reference', type: 'benchResourceSide'}),
      ],
    }),
    defineField({
      name: 'soak',
      description: 'Soak series (soak mode only)',
      type: 'object',
      fields: [
        defineField({name: 'minutes', type: 'number'}),
        defineField({
          name: 'samples',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'soakSample',
              fields: [
                defineField({name: 'minute', type: 'number'}),
                defineField({name: 'heapMb', type: 'number'}),
                defineField({name: 'domNodes', type: 'number'}),
                defineField({name: 'listeners', type: 'number'}),
                defineField({name: 'latencyP50Ms', type: 'number'}),
                defineField({name: 'cpuTaskMs', type: 'number'}),
                defineField({name: 'connections', type: 'number'}),
                defineField({name: 'requests', type: 'number'}),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {scenario: 'scenario', kind: 'kind', stoppedBy: 'stoppedBy'},
    prepare: ({scenario, kind, stoppedBy}) => ({
      title: scenario,
      subtitle: [kind, stoppedBy].filter(Boolean).join(' · '),
    }),
  },
})

const bundleSizesFields = [
  defineField({name: 'initialJsBytes', type: 'number'}),
  defineField({name: 'totalJsBytes', type: 'number'}),
  defineField({name: 'chunkCount', type: 'number'}),
]

const benchRun = defineType({
  name: 'benchRun',
  title: 'Benchmark run',
  type: 'document',
  icon: BarChartIcon,
  readOnly: true,
  // Machine-written by CI via createOrReplace — no draft/publish workflow, so
  // edit the published document directly (matches how `bench store` writes).
  liveEdit: true,
  fields: [
    defineField({name: 'schemaVersion', type: 'number'}),
    defineField({name: 'mode', type: 'string', options: {list: ['ab', 'absolute']}}),
    defineField({
      name: 'git',
      type: 'object',
      fields: [
        defineField({name: 'sha', type: 'string'}),
        defineField({name: 'branch', type: 'string'}),
        defineField({name: 'mergeBaseSha', type: 'string'}),
        defineField({name: 'prNumber', type: 'number'}),
      ],
    }),
    defineField({name: 'startedAt', type: 'datetime'}),
    defineField({name: 'completedAt', type: 'datetime'}),
    defineField({
      name: 'runner',
      type: 'object',
      fields: [
        defineField({name: 'os', type: 'string'}),
        defineField({name: 'arch', type: 'string'}),
        defineField({name: 'cpus', type: 'number'}),
        defineField({name: 'memGb', type: 'number'}),
        defineField({name: 'nodeVersion', type: 'string'}),
        defineField({name: 'ci', type: 'boolean'}),
        defineField({name: 'runId', type: 'string'}),
        defineField({name: 'runAttempt', type: 'number'}),
        defineField({
          name: 'calibrationMs',
          description: 'Host-speed score (ms for a fixed workload; higher = slower host)',
          type: 'number',
        }),
      ],
    }),
    defineField({
      name: 'config',
      type: 'object',
      fields: [
        defineField({name: 'cpuThrottleRate', type: 'number'}),
        defineField({name: 'seed', type: 'number'}),
      ],
    }),
    defineField({
      name: 'scenarios',
      type: 'array',
      of: [defineArrayMember({type: 'benchScenario'})],
    }),
    defineField({
      name: 'bundle',
      type: 'object',
      fields: [
        defineField({name: 'experiment', type: 'object', fields: bundleSizesFields}),
        defineField({name: 'reference', type: 'object', fields: bundleSizesFields}),
      ],
    }),
  ],
  preview: {
    select: {branch: 'git.branch', sha: 'git.sha', mode: 'mode', startedAt: 'startedAt'},
    prepare: ({branch, sha, mode, startedAt}) => ({
      title: `${branch ?? '?'} @ ${typeof sha === 'string' ? sha.slice(0, 10) : '?'}`,
      subtitle: [mode, startedAt ? new Date(startedAt).toUTCString() : null]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})

export const benchRunTypes = [
  benchRun,
  benchScenario,
  benchMetric,
  benchSideMetric,
  benchResourceSide,
]
