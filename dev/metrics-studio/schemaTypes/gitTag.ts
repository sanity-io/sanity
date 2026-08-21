import {TagIcon} from '@sanity/icons/Tag'
import {defineField, defineType} from 'sanity'

/**
 * One `v*` release tag (major >= 5) — written by scripts/syncGitHistory.ts
 * (CI: .github/workflows/sync-git-metrics.yml), which re-upserts all
 * qualifying tags on every run (they're few enough that stateless re-sync
 * beats bookkeeping). Deterministic id `gitTag-<tagName>`.
 *
 * `commit` is a WEAK reference built from the deterministic commit id: weak
 * because ingestion order isn't guaranteed and release-line tags (e.g. a
 * v5.x patch cut from a release branch) point at commits that are not on
 * main and so never get a gitCommit document — the tag stays self-describing
 * via `sha`/`taggedAt`/semver. `sha` is kept as a plain string alongside for
 * by-value joins (matching how `benchRun.git.sha` joins today).
 *
 * Parsed semver fields exist because release lines interleave in time
 * (v5.31.2 shipped after v6.10.1) — grouping by `major` is how a "release
 * line" is reconstructed in GROQ.
 */
export const gitTag = defineType({
  name: 'gitTag',
  title: 'Release tag',
  type: 'document',
  icon: TagIcon,
  // Machine-written (createOrReplace from the sync script) — browsable but
  // not editable, and no draft workflow.
  readOnly: true,
  liveEdit: true,
  fields: [
    defineField({name: 'schemaVersion', type: 'number'}),
    defineField({name: 'tag', description: 'Tag name, e.g. v6.10.1', type: 'string'}),
    defineField({
      name: 'sha',
      description: 'Dereferenced commit sha the tag points at (plain string for by-value joins)',
      type: 'string',
    }),
    defineField({
      name: 'commit',
      description: 'Weak: dangles (resolves to null) for tags cut off-main',
      type: 'reference',
      to: [{type: 'gitCommit'}],
      weak: true,
    }),
    defineField({
      name: 'taggedAt',
      description: 'Tag creation date (committer date for lightweight tags)',
      type: 'datetime',
    }),
    defineField({name: 'major', type: 'number'}),
    defineField({name: 'minor', type: 'number'}),
    defineField({name: 'patch', type: 'number'}),
    defineField({
      name: 'prerelease',
      description: 'Prerelease identifier, e.g. rc.1 — absent on stable releases',
      type: 'string',
    }),
    defineField({
      name: 'npm',
      description:
        'npm registry enrichment for the matching sanity@<version> — refreshed on tag pushes, the daily cron, and dispatches (not every push). Absent when npm does not know the version.',
      type: 'object',
      fields: [
        defineField({name: 'publishedAt', type: 'datetime'}),
        defineField({
          name: 'distTags',
          description: 'Dist-tags currently pointing at this version (latest, stable, …)',
          type: 'array',
          of: [{type: 'string'}],
        }),
        defineField({name: 'weeklyDownloads', type: 'number'}),
      ],
    }),
  ],
  preview: {
    select: {tag: 'tag', taggedAt: 'taggedAt', sha: 'sha'},
    prepare: ({tag, taggedAt, sha}) => ({
      title: tag,
      subtitle: `${taggedAt?.slice(0, 10)} · ${sha?.slice(0, 10)}`,
    }),
  },
})
