import {LockIcon} from '@sanity/icons/Lock'
import {defineField, defineType} from 'sanity'

export const noVersionsLiveEditType = defineType({
  name: 'noVersionsLiveEdit',
  title: 'No versions (live edit)',
  type: 'document',
  description: 'No drafts, releases or variants: edited in place only',
  icon: LockIcon,
  liveEdit: true,
  versions: [],
  fields: [defineField({name: 'title', type: 'string'})],
})

export const releasesOnlyType = defineType({
  name: 'releasesOnly',
  title: 'Releases only',
  type: 'document',
  description: 'Can be added to releases, but has no variants',
  icon: LockIcon,
  versions: ['releases'],
  fields: [defineField({name: 'title', type: 'string'})],
})

export const variantsOnlyType = defineType({
  name: 'variantsOnly',
  title: 'Variants only',
  type: 'document',
  description: 'Can have variants, but cannot be added to releases',
  icon: LockIcon,
  versions: ['variants'],
  fields: [defineField({name: 'title', type: 'string'})],
})
