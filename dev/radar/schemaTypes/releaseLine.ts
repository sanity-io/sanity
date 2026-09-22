import {ArchiveIcon} from '@sanity/icons/Archive'
import {defineField, defineType} from 'sanity'

/**
 * A release line (major version) marked end of life from the Releases tool.
 * The document's existence IS the mark: reinstating a line deletes it.
 * Written by the dashboard via createOrReplace (id `release-line-v<major>`,
 * see @repo/utils/radar-ids) — its own type rather than a flag on `gitTag`,
 * because the git sync replaces tag documents whole and would erase it.
 */
export const releaseLine = defineType({
  name: 'releaseLine',
  title: 'Release line',
  type: 'document',
  icon: ArchiveIcon,
  // No draft workflow — the Releases tool's realtime listenQuery expects
  // immediate effect, like driftAck and bisectSession.
  liveEdit: true,
  fields: [
    defineField({
      name: 'major',
      description: 'The major version the line is, e.g. 5 for every v5.x.y release',
      type: 'number',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({name: 'eolMarkedAt', title: 'Marked end of life at', type: 'datetime'}),
    defineField({name: 'eolMarkedBy', title: 'Marked end of life by', type: 'string'}),
    defineField({name: 'note', type: 'string'}),
  ],
  preview: {
    select: {major: 'major', eolMarkedAt: 'eolMarkedAt', eolMarkedBy: 'eolMarkedBy'},
    prepare: ({major, eolMarkedAt, eolMarkedBy}) => ({
      title: `v${major}`,
      subtitle: `end of life since ${eolMarkedAt?.slice(0, 10)} (${eolMarkedBy})`,
    }),
  },
})
