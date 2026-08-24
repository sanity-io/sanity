import {TagIcon} from '@sanity/icons/Tag'
import {defineField, defineType} from 'sanity'

/**
 * One `v*` release tag (major >= 5) — written by scripts/syncGitHistory.ts
 * with deterministic id `gitTag-<tagName>`.
 *
 * `commit` is a weak reference: ingestion order isn't guaranteed, and tags
 * cut from release branches point at commits that never get a gitCommit
 * document. `sha` stays alongside as a plain string for by-value joins. The
 * parsed semver fields exist because release lines interleave in time
 * (v5.31.2 shipped after v6.10.1) — grouping by `major` reconstructs a line
 * in GROQ.
 */
export const gitTag = defineType({
  name: 'gitTag',
  title: 'Release tag',
  type: 'document',
  icon: TagIcon,
  // Machine-written: browsable but not editable, no draft workflow
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
        'npm registry data for the matching sanity@<version> — absent when npm does not know it',
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
