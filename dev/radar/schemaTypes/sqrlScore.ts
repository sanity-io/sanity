import {DashboardIcon} from '@sanity/icons/Dashboard'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * SQRL (Studio Quality: Reliability & Latency) for one measured main commit —
 * written by scripts/sqrl.ts in bench.yml after `bench store`, id
 * `sqrl-score-<sha>`. Values and references include the smoothing offset the
 * ratio uses (+1 on the reliability count, +0.01 on CLS, +1 per settle
 * scenario on commits, +k on soak heap growth), so `ratio` is always
 * referenceValue ÷ value. Formula and versioning: SPEC.md, "SQRL score".
 */
export const sqrlScore = defineType({
  name: 'sqrlScore',
  title: 'SQRL score',
  type: 'document',
  icon: DashboardIcon,
  readOnly: true,
  liveEdit: true,
  fields: [
    defineField({
      name: 'formulaVersion',
      description: 'Bumped on any formula change, which rewrites the whole history by backfill',
      type: 'number',
    }),
    defineField({name: 'computedAt', type: 'datetime'}),
    defineField({
      name: 'git',
      type: 'object',
      fields: [
        defineField({name: 'sha', type: 'string'}),
        defineField({name: 'committedAt', type: 'datetime'}),
        defineField({name: 'branch', type: 'string'}),
      ],
    }),
    defineField({
      name: 'benchRunIds',
      description: 'benchRun documents merged (by median) for this commit',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'score',
      description: 'Headline: host-adjusted 7-commit rolling median, reference window = 100',
      type: 'number',
    }),
    defineField({
      name: 'scoreCommit',
      description: 'This commit alone, host-adjusted, reference window = 100',
      type: 'number',
    }),
    defineField({
      name: 'scoreRaw',
      description: 'This commit alone, without host adjustment, reference window = 100',
      type: 'number',
    }),
    defineField({
      name: 'host',
      type: 'object',
      fields: [
        defineField({name: 'calibrationMs', type: 'number'}),
        defineField({name: 'cpuModel', type: 'string'}),
      ],
    }),
    defineField({
      name: 'pillars',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'sqrlPillar',
          type: 'object',
          fields: [
            defineField({
              name: 'key',
              type: 'string',
              options: {list: ['inp', 'responsiveness', 'load', 'cpu', 'memory', 'reliability']},
            }),
            defineField({name: 'label', type: 'string'}),
            defineField({name: 'weight', type: 'number'}),
            defineField({
              name: 'score',
              description:
                'Pillar on the 7-commit median, rebased like the headline: reference window = 100',
              type: 'number',
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'score'}},
        }),
      ],
    }),
    defineField({
      name: 'inputs',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'sqrlInput',
          type: 'object',
          fields: [
            defineField({name: 'key', type: 'string'}),
            defineField({name: 'label', type: 'string'}),
            defineField({name: 'pillar', type: 'string'}),
            defineField({
              name: 'weight',
              description: 'Effective share of the headline',
              type: 'number',
            }),
            defineField({
              name: 'unit',
              type: 'string',
              options: {list: ['ms', 'bytes', 'count', 'cls', 'megabytes', 'perMinute', 'events']},
            }),
            defineField({
              name: 'value',
              description: 'Host-adjusted 7-commit median',
              type: 'number',
            }),
            defineField({name: 'referenceValue', type: 'number'}),
            defineField({
              name: 'ratio',
              description: 'referenceValue ÷ value; above 1 is better than the reference',
              type: 'number',
            }),
            defineField({
              name: 'contributionPoints',
              description:
                'Points this input adds to the headline against 100; they sum to score − 100',
              type: 'number',
            }),
            defineField({
              name: 'trend',
              description:
                "Radar's drift rule on the per-commit values: last 7 commits vs the prior 21",
              type: 'string',
              options: {list: ['regression', 'improvement', 'neutral', 'insufficient']},
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'trend'}},
        }),
      ],
    }),
    defineField({
      name: 'reliability',
      type: 'object',
      fields: [
        defineField({name: 'windowWeeks', type: 'number'}),
        defineField({name: 'count', type: 'number'}),
        defineField({name: 'referenceCount', type: 'number'}),
        defineField({
          name: 'events',
          type: 'array',
          of: [
            defineArrayMember({
              name: 'sqrlReliabilityEvent',
              type: 'object',
              fields: [
                defineField({
                  name: 'kind',
                  type: 'string',
                  options: {list: ['deprecation', 'hotpatch']},
                }),
                defineField({name: 'tag', type: 'string'}),
                defineField({name: 'day', type: 'date'}),
              ],
              preview: {select: {title: 'tag', subtitle: 'kind'}},
            }),
          ],
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Committed, newest first',
      name: 'committedAtDesc',
      by: [{field: 'git.committedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {score: 'score', sha: 'git.sha', committedAt: 'git.committedAt'},
    prepare: ({score, sha, committedAt}) => ({
      title: typeof score === 'number' ? `SQRL ${score.toFixed(1)}` : 'SQRL',
      subtitle: `${committedAt?.slice(0, 10)} · ${sha?.slice(0, 10)}`,
    }),
  },
})
