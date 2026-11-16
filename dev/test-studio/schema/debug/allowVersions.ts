import {LockIcon} from '@sanity/icons/Lock'
import {defineField, defineType} from 'sanity'

export const noVersionsLiveEditType = defineType({
  name: 'noVersionsLiveEdit',
  title: 'No versions (live edit)',
  type: 'document',
  description: 'No drafts, releases or variants: edited in place only',
  icon: LockIcon,
  liveEdit: true,
  allowVersions: false,
  fields: [defineField({name: 'title', type: 'string'})],
})

export const noVersionsType = defineType({
  name: 'noVersions',
  title: 'No versions (drafts)',
  type: 'document',
  description: 'Drafts, but no releases or variants',
  icon: LockIcon,
  allowVersions: false,
  fields: [defineField({name: 'title', type: 'string'})],
})
