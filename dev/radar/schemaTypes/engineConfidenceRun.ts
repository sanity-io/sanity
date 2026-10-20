import {
  CATALOGUE_SUITE_IDS,
  ENGINE_CONFIDENCE_RUN_TYPE,
  STRYKER_TARGET_IDS,
} from '@repo/utils/engine-confidence'
import {BarChartIcon} from '@sanity/icons/BarChart'
import {defineArrayMember, defineField, defineType} from 'sanity'

/** Mirrors `EngineConfidenceRunDocument`. A score or summary that was not measured stores only `status` and `reason`, so every other field is optional. */

const mutantCountsFields = [
  defineField({name: 'killed', type: 'number'}),
  defineField({name: 'timeout', type: 'number'}),
  defineField({name: 'survived', type: 'number'}),
  defineField({name: 'noCoverage', type: 'number'}),
  defineField({name: 'runtimeError', type: 'number'}),
  defineField({name: 'compileError', type: 'number'}),
  defineField({
    name: 'ignored',
    description: 'Skipped by the ignore rules (error messages, log calls)',
    type: 'number',
  }),
  defineField({
    name: 'excluded',
    description: 'Survived or uncovered mutants a reviewer judged meaningless to test',
    type: 'number',
  }),
]

const statusFields = [
  defineField({
    name: 'status',
    type: 'string',
    options: {list: ['measured', 'not-measured']},
  }),
  defineField({
    name: 'reason',
    description: 'Why it is not measured; absent when it is',
    type: 'string',
  }),
]

const score = defineField({
  name: 'score',
  description:
    'The engine confidence score: Stryker mutation score of the engine files, the share of generated bugs a test fails on. Reporting should read score.ratio.',
  type: 'object',
  fields: [
    ...statusFields,
    defineField({name: 'ratio', description: 'Fraction in [0, 1]', type: 'number'}),
    defineField({
      name: 'coveredRatio',
      description: 'Same score leaving out mutants no test reaches',
      type: 'number',
    }),
    defineField({name: 'counts', type: 'object', fields: mutantCountsFields}),
    defineField({
      name: 'targets',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'strykerTargetRun',
          fields: [
            defineField({
              name: 'target',
              type: 'string',
              options: {list: [...STRYKER_TARGET_IDS]},
            }),
            defineField({
              name: 'mode',
              description: 'full re-tests every mutant; incremental reuses unchanged results',
              type: 'string',
              options: {list: ['full', 'incremental']},
            }),
            defineField({name: 'reusedMutants', type: 'number'}),
            defineField({name: 'dryRunTests', type: 'number'}),
            defineField({name: 'durationMs', type: 'number'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'files',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'mutatedFileResult',
          fields: [
            defineField({name: 'path', type: 'string'}),
            defineField({
              name: 'target',
              type: 'string',
              options: {list: [...STRYKER_TARGET_IDS]},
            }),
            defineField({name: 'counts', type: 'object', fields: mutantCountsFields}),
          ],
        }),
      ],
    }),
  ],
})

const knownBugs = defineField({
  name: 'knownBugs',
  description:
    'The known-bug catalogue (real engine bugs replayed as patches), kept as supporting detail only: it never feeds the score.',
  type: 'object',
  fields: [
    ...statusFields,
    defineField({name: 'activeEntries', type: 'number'}),
    defineField({name: 'caughtEntries', type: 'number'}),
    defineField({
      name: 'entries',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'catalogueEntryResult',
          fields: [
            defineField({name: 'id', type: 'string'}),
            defineField({name: 'title', type: 'string'}),
            defineField({
              name: 'severity',
              type: 'string',
              options: {list: ['S1', 'S2', 'S3']},
            }),
            defineField({name: 'failureClass', type: 'string'}),
            defineField({name: 'sourceUrl', type: 'url'}),
            defineField({name: 'addedOn', type: 'string'}),
            defineField({
              name: 'results',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'catalogueSuiteResult',
                  fields: [
                    defineField({
                      name: 'suite',
                      type: 'string',
                      options: {list: [...CATALOGUE_SUITE_IDS]},
                    }),
                    defineField({
                      name: 'status',
                      type: 'string',
                      options: {list: ['caught', 'missed', 'not-applicable', 'not-run']},
                    }),
                    defineField({
                      name: 'failingTests',
                      type: 'array',
                      of: [defineArrayMember({type: 'string'})],
                    }),
                    defineField({name: 'durationMs', type: 'number'}),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})

const engineConfidenceRun = defineType({
  name: ENGINE_CONFIDENCE_RUN_TYPE,
  title: 'Engine confidence run',
  type: 'document',
  icon: BarChartIcon,
  readOnly: true,
  liveEdit: true,
  fields: [
    defineField({name: 'schemaVersion', type: 'number'}),
    defineField({
      name: 'isoWeek',
      description: 'ISO week of startedAt in UTC, e.g. 2026-W42; also the id suffix',
      type: 'string',
    }),
    defineField({
      name: 'trigger',
      type: 'string',
      options: {list: ['schedule', 'dispatch', 'local']},
    }),
    defineField({name: 'startedAt', type: 'datetime'}),
    defineField({name: 'completedAt', type: 'datetime'}),
    defineField({
      name: 'git',
      type: 'object',
      fields: [
        defineField({name: 'sha', type: 'string'}),
        defineField({
          name: 'commit',
          type: 'reference',
          to: [{type: 'gitCommit'}],
          weak: true,
          description:
            'Weak link to the measured commit’s gitCommit document; may dangle until the git sync has run. git.sha is the source of truth.',
        }),
        defineField({name: 'branch', type: 'string'}),
        defineField({name: 'committedAt', type: 'datetime'}),
      ],
    }),
    defineField({
      name: 'runner',
      type: 'object',
      fields: [
        defineField({name: 'os', type: 'string'}),
        defineField({name: 'arch', type: 'string'}),
        defineField({name: 'cpus', type: 'number'}),
        defineField({name: 'memGb', type: 'number'}),
        defineField({name: 'nodeVersion', type: 'string'}),
        defineField({name: 'cpuModel', type: 'string'}),
        defineField({name: 'imageOs', type: 'string'}),
        defineField({name: 'imageVersion', type: 'string'}),
        defineField({name: 'ci', type: 'boolean'}),
        defineField({name: 'runId', type: 'string'}),
        defineField({name: 'runAttempt', type: 'number'}),
      ],
    }),
    defineField({
      name: 'config',
      description:
        'The pinned measurement config. A version change breaks the series: scores either side of it are not comparable.',
      type: 'object',
      fields: [
        defineField({name: 'version', type: 'number'}),
        defineField({name: 'hash', type: 'string'}),
        defineField({name: 'strykerVersion', type: 'string'}),
        defineField({name: 'vitestVersion', type: 'string'}),
        defineField({name: 'timeoutMs', type: 'number'}),
        defineField({name: 'concurrency', type: 'number'}),
        defineField({
          name: 'fuzzSeeds',
          type: 'array',
          of: [defineArrayMember({type: 'number'})],
        }),
        defineField({name: 'fuzzRuns', type: 'number'}),
      ],
    }),
    score,
    knownBugs,
  ],
  preview: {
    select: {isoWeek: 'isoWeek', ratio: 'score.ratio', sha: 'git.sha'},
    prepare: ({isoWeek, ratio, sha}) => ({
      title: isoWeek ?? 'Engine confidence run',
      subtitle: [
        typeof ratio === 'number' ? `${(ratio * 100).toFixed(1)}%` : 'not measured',
        typeof sha === 'string' ? sha.slice(0, 10) : undefined,
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})

export const engineConfidenceRunTypes = [engineConfidenceRun]
