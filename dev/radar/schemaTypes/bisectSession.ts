import {TargetIcon} from '@sanity/icons/Target'
import {defineField, defineType} from 'sanity'

/**
 * One guided bisect run over mainline history: endpoints picked in the Bisect
 * tool, a append-only log of good/bad/skip marks, and — once converged — the
 * verdict. Unlike `gitCommit`/`gitTag` (machine written, read-only), these
 * are written from the Bisect tool via the client, like `driftAck`.
 *
 * Everything the stepper shows is derived live from `marks` + the commit
 * chain (tools/bisect/bisect.ts); `result` is denormalized at convergence
 * only so the sessions list can show the verdict without loading the ~2k
 * commit documents. Undoing a mark clears it again.
 *
 * Id: `bisectSession-<uuid>` — sessions are user-created, not idempotent.
 */
export const bisectSession = defineType({
  name: 'bisectSession',
  title: 'Bisect session',
  type: 'document',
  icon: TargetIcon,
  // Written by the Bisect tool via client.create/patch — no draft workflow;
  // the tool's realtime listenQuery expects immediate effect.
  liveEdit: true,
  fields: [
    defineField({
      name: 'title',
      description: 'Set at creation, e.g. “v6.9.2 → 1a2b3c4”',
      type: 'string',
    }),
    defineField({
      name: 'good',
      description: 'The known-good endpoint (older)',
      type: 'object',
      fields: [
        defineField({name: 'sha', description: 'Full 40-char sha', type: 'string'}),
        defineField({
          name: 'label',
          description: 'How it was picked — a tag name or short sha',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'bad',
      description: 'The known-bad endpoint (newer)',
      type: 'object',
      fields: [
        defineField({name: 'sha', description: 'Full 40-char sha', type: 'string'}),
        defineField({
          name: 'label',
          description: 'How it was picked — a tag name or short sha',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'releasesOnly',
      description: 'Only propose commits that are release tags — bisecting versions, not commits',
      type: 'boolean',
    }),
    defineField({
      name: 'marks',
      description: 'Append-only verdict log — the last mark per sha wins; undo removes the tail',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({name: 'sha', type: 'string'}),
            defineField({
              name: 'verdict',
              type: 'string',
              options: {list: ['good', 'bad', 'skip']},
            }),
            defineField({name: 'markedAt', type: 'datetime'}),
            defineField({name: 'markedBy', type: 'string'}),
          ],
          preview: {
            select: {sha: 'sha', verdict: 'verdict'},
            prepare: ({sha, verdict}) => ({title: `${verdict}: ${sha?.slice(0, 10)}`}),
          },
        },
      ],
    }),
    defineField({
      name: 'result',
      description: 'Written once at convergence — the sessions list reads this, nothing else does',
      type: 'object',
      fields: [
        defineField({name: 'firstBadSha', type: 'string'}),
        defineField({name: 'lastGoodSha', type: 'string'}),
        defineField({
          name: 'suspectShas',
          description: 'Untestable/skipped commits between last good and first bad',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({
          name: 'regression',
          description: 'Human classification: the found commit is a confirmed regression',
          type: 'boolean',
        }),
        defineField({
          name: 'description',
          description: 'What broke, in the bisector’s words',
          type: 'text',
          rows: 2,
        }),
        defineField({
          name: 'linearIssue',
          description: 'Linear ticket id, e.g. SAPP-1234',
          type: 'string',
        }),
        defineField({name: 'concludedAt', type: 'datetime'}),
      ],
    }),
    defineField({name: 'createdAt', type: 'datetime'}),
    defineField({name: 'createdBy', type: 'string'}),
  ],
  preview: {
    select: {title: 'title', firstBadSha: 'result.firstBadSha', markCount: 'marks'},
    prepare: ({title, firstBadSha, markCount}) => ({
      title,
      subtitle: firstBadSha
        ? `found ${firstBadSha.slice(0, 10)}`
        : `${Array.isArray(markCount) ? markCount.length : 0} mark${Array.isArray(markCount) && markCount.length === 1 ? '' : 's'}`,
    }),
  },
})
