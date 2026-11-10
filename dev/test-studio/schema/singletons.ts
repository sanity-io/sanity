import {CogIcon} from '@sanity/icons/Cog'
import {RocketIcon} from '@sanity/icons/Rocket'
import {defineField, defineType} from '@sanity/types'

export const singletonSettings = defineType({
  name: 'singletonSettings',
  title: 'Singleton settings (example)',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Site title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
  ],
})

/**
 * Example schema type shared by multiple singletons. The `springCampaign` and
 * `summerCampaign` singleton definitions both use this type, demonstrating that
 * singletons are decoupled from schema types.
 */
export const singletonCampaign = defineType({
  name: 'singletonCampaign',
  title: 'Singleton campaign (example)',
  type: 'document',
  icon: RocketIcon,
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
    }),
    defineField({
      name: 'startDate',
      title: 'Start date',
      type: 'date',
    }),
  ],
})
