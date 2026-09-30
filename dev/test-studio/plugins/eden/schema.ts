import {defineArrayMember, defineField, defineType} from 'sanity'

export const EDEN_STATUSES = [
  {value: 'idea', title: 'Ideas'},
  {value: 'drafting', title: 'Drafting'},
  {value: 'in-review', title: 'In review'},
  {value: 'ready', title: 'Ready to publish'},
] as const

export type EdenStatus = (typeof EDEN_STATUSES)[number]['value']

const SECTIONS = ['Politics', 'Business', 'Technology', 'Health', 'Media', 'Energy']

const edenStory = defineType({
  name: 'edenStory',
  title: 'Story',
  type: 'document',
  fields: [
    defineField({
      name: 'headline',
      type: 'string',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'status',
      type: 'string',
      initialValue: 'idea',
      options: {list: EDEN_STATUSES.map(({value, title}) => ({value, title}))},
    }),
    defineField({
      name: 'section',
      type: 'string',
      options: {list: SECTIONS},
    }),
    defineField({
      name: 'byline',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'summary',

      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({name: 'featuredImage', type: 'image', options: {hotspot: true}}),
    defineField({name: 'publishAt', title: 'Publish at', type: 'datetime'}),
  ],
  preview: {
    select: {title: 'headline', section: 'section', byline: 'byline'},
    prepare: ({title, section, byline}) => ({
      title: title || 'Untitled story',
      subtitle: [section, (byline || []).join(', ')].filter(Boolean).join(' · '),
    }),
  },
})

const edenNewsletter = defineType({
  name: 'edenNewsletter',
  title: 'Newsletter',
  type: 'document',
  fields: [
    defineField({
      name: 'headline',
      title: 'Subject line',
      type: 'string',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'status',
      type: 'string',
      initialValue: 'idea',
      options: {list: EDEN_STATUSES.map(({value, title}) => ({value, title}))},
    }),
    defineField({
      name: 'edition',
      type: 'string',
      options: {list: ['AM', 'PM', 'Weekend']},
    }),
    defineField({
      name: 'byline',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({name: 'intro', type: 'array', of: [defineArrayMember({type: 'block'})]}),
    defineField({name: 'publishAt', title: 'Send at', type: 'datetime'}),
  ],
  preview: {
    select: {title: 'headline', edition: 'edition', byline: 'byline'},
    prepare: ({title, edition, byline}) => ({
      title: title || 'Untitled newsletter',
      subtitle: [edition, (byline || []).join(', ')].filter(Boolean).join(' · '),
    }),
  },
})

export const edenSchemaTypes = [edenStory, edenNewsletter]
export const EDEN_TYPES = ['edenStory', 'edenNewsletter']
