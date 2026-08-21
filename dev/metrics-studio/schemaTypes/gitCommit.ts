import {DotIcon} from '@sanity/icons/Dot'
import {defineField, defineType} from 'sanity'

/**
 * One commit on main, metadata only — written by scripts/syncGitHistory.ts
 * (CI: .github/workflows/sync-git-metrics.yml), which upserts a trailing
 * window of history on every push. Deterministic id `gitCommit-<sha>` makes
 * the sync idempotent. History covered since v5.0.0.
 *
 * The conventional-commit fields (`commitType`, `scope`, `breaking`,
 * `prNumber`) are best-effort parses of the subject and absent where the
 * subject doesn't conform (~half the pre-convention history). Joins against
 * other documents are by value: `benchRun.git.sha` ↔ `sha`, and time-axis
 * joins on `committedAt`.
 */
export const gitCommit = defineType({
  name: 'gitCommit',
  title: 'Commit',
  type: 'document',
  icon: DotIcon,
  // Machine-written (createOrReplace from the sync script) — browsable but
  // not editable, and no draft workflow.
  readOnly: true,
  liveEdit: true,
  fields: [
    defineField({name: 'schemaVersion', type: 'number'}),
    defineField({
      name: 'sha',
      description: 'Full 40-char commit sha (also in _id)',
      type: 'string',
    }),
    defineField({
      name: 'parentSha',
      description:
        'First-parent sha — the linear mainline chain link (the Bisect tool walks it). Absent on a root commit; points outside the synced set at the v5.0.0 cutoff boundary.',
      type: 'string',
    }),
    defineField({name: 'authorName', type: 'string'}),
    defineField({name: 'authorEmail', type: 'string'}),
    defineField({
      name: 'authorLogin',
      description:
        'GitHub account the author email maps to (collected from the GitHub API). Absent when GitHub has no mapping.',
      type: 'string',
    }),
    defineField({
      name: 'authorAvatarUrl',
      description:
        'GitHub\u2019s avatar URL for that account (collected, not derived \u2014 bot avatars live under /in/<app-id>).',
      type: 'url',
    }),
    defineField({name: 'authoredAt', type: 'datetime'}),
    defineField({
      name: 'committedAt',
      description: 'Committer date — the time-axis join key (matches benchRun.git.committedAt)',
      type: 'datetime',
    }),
    defineField({name: 'subject', description: 'Raw first line of the message', type: 'string'}),
    defineField({
      name: 'commitType',
      description: 'Parsed conventional-commit type (feat/fix/chore/…) — absent if unparseable',
      type: 'string',
    }),
    defineField({name: 'scope', description: 'Parsed conventional-commit scope', type: 'string'}),
    defineField({
      name: 'breaking',
      description: 'Conventional-commit “!” marker — only set when true',
      type: 'boolean',
    }),
    defineField({
      name: 'prNumber',
      description: 'From the squash-merge subject’s trailing “(#1234)”',
      type: 'number',
    }),
    defineField({
      name: 'testStudioUrl',
      description:
        'Immutable Vercel deploy of dev/test-studio built at this commit (collected from GitHub deployment statuses). Absent when the build was skipped or had not finished when last synced.',
      type: 'url',
    }),
  ],
  preview: {
    select: {subject: 'subject', sha: 'sha', committedAt: 'committedAt'},
    prepare: ({subject, sha, committedAt}) => ({
      title: subject,
      subtitle: `${sha?.slice(0, 10)} · ${committedAt?.slice(0, 10)}`,
    }),
  },
})
