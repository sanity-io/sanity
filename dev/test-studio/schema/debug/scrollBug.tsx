import {defineArrayMember, defineField, defineType, PreviewProps} from 'sanity'
import {
  ActivityIcon,
  ClipboardIcon,
  ComponentIcon,
  ErrorOutlineIcon,
  PackageIcon,
  RocketIcon,
  TrendUpwardIcon,
} from '@sanity/icons'
import React from 'react'
import {Stack, Text} from '@sanity/ui'

export const articleImage = defineType({
  type: 'image',
  name: 'articleImage',
  title: 'Image',
  fields: [
    defineField({
      type: 'string',
      name: 'altText',
      title: 'Alt text',
    }),
  ],
})

export const mockObject2 = defineType({
  type: 'object',
  name: 'mockObject2',
  title: 'Details',
  icon: PackageIcon,
  fields: [
    defineField({
      type: 'text',
      name: 'note',
      title: 'Note',
    }),
  ],
  preview: {
    select: {
      title: 'note',
    },
    prepare: (select) => {
      return {
        ...select,
        media: PackageIcon,
      }
    },
  },
})

export const tidbitsTest = defineType({
  type: 'object',
  name: 'tidbitsItem',
  title: 'Tidbits',
  icon: RocketIcon,
  fields: [
    defineField({
      type: 'string',
      name: 'fact',
      title: 'Fact',
    }),
    defineField({
      type: 'string',
      name: 'contradiction',
      title: 'Contradiction',
    }),
  ],
  preview: {
    select: {
      title: 'fact',
      subtitle: 'contradiction',
    },
    prepare: (select) => {
      return {
        ...select,
        media: RocketIcon,
      }
    },
  },
})

export const factBox = defineType({
  type: 'object',
  name: 'factBox',
  title: 'Factbox',
  icon: ErrorOutlineIcon,
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    defineField({
      type: 'string',
      name: 'subtitle',
      title: 'Subtitle',
    }),
    defineField({
      type: 'text',
      name: 'facts',
      title: 'Facts',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      facts: 'facts',
    },
    prepare: (select) => {
      return {
        ...select,
        media: ErrorOutlineIcon,
      }
    },
  },
})

export const todo = defineType({
  type: 'object',
  name: 'todo',
  title: 'Todo',
  icon: ClipboardIcon,
  fields: [
    defineField({
      type: 'array',
      name: 'items',
      title: 'Todo items',
      of: [{type: 'string'}],
    }),
  ],
  preview: {
    select: {
      items: 'items',
    },
    prepare: ({items = []}) => {
      return {
        title: `Todo (${items.length} items)`,
        items,
        media: ClipboardIcon,
      }
    },
  },
  components: {
    preview: (props: any) => {
      return (
        <Stack space={2} padding={2}>
          <Text weight="semibold">Article TODOs</Text>
          <ul>
            {props?.items?.map((t: string) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Stack>
      )
    },
  },
})

export const timelineEvent = defineType({
  type: 'object',
  name: 'timelineEvent',
  title: 'Timeline event',
  icon: ActivityIcon,
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    defineField({
      type: 'string',
      name: 'periodDescription',
      title: 'Period description',
    }),
    defineField({
      type: 'text',
      name: 'eventDescription',
      title: 'Event description',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'periodDescription',
    },
  },
})

export const timeline = defineType({
  type: 'object',
  name: 'timeline',
  title: 'Timeline',
  icon: TrendUpwardIcon,
  fields: [
    defineField({
      type: 'array',
      name: 'events',
      title: 'Events',
      of: [defineArrayMember({type: timelineEvent.name})],
    }),
  ],
  preview: {
    select: {
      events: 'events',
    },
    prepare: ({events = []}) => {
      return {
        title: `Events (${events.length})`,
        events,
        media: TrendUpwardIcon,
      }
    },
  },
  components: {
    preview: (props: PreviewProps & {events?: any[]}) => {
      return (
        <Stack space={2} padding={2}>
          <Text weight="semibold">Timeline</Text>
          <ul>
            {props?.events?.map((event: {title: string; periodDescription: string}) => (
              <li key={event?.title}>
                {event?.title ?? 'No title'} - {event?.periodDescription ?? 'No description'}
              </li>
            ))}
          </ul>
        </Stack>
      )
    },
  },
})

export const mockObject1 = defineType({
  type: 'object',
  name: 'mockObject1',
  title: 'Thing',
  icon: ComponentIcon,
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    defineField({
      type: 'text',
      name: 'description',
      title: 'Description',
    }),
    /*defineField({
      name: 'listOfThings',
      title: 'A list of things',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {
            decorators: [{title: 'Strong', value: 'strong'}],
            annotations: [],
          },
        },
      ],
    }),*/
    defineField({
      type: mockObject2.name,
      name: 'inner',
      title: 'Details',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
    },
    prepare: (select) => {
      return {
        ...select,
        media: ComponentIcon,
      }
    },
  },
})

export const seoObject = defineType({
  type: 'object',
  name: 'seoObject',
  title: 'SEO',
  fields: [
    defineField({
      type: 'string',
      name: 'seoTitle',
      title: 'SEO title',
    }),
    defineField({
      type: 'text',
      name: 'seoDescription',
      title: 'SEO Description',
    }),
    defineField({
      type: 'array',
      name: 'seoKeywords',
      title: 'SEO Keywords',
      of: [{type: 'string'}],
    }),
  ],
  options: {
    collapsible: true,
  },
})

export const scrollBug = defineType({
  type: 'document',
  name: 'scrollBug',
  title: 'Scroll bug article',
  /*  components: {
    input: ForceSummarizationButton,
  },*/
  fieldsets: [{name: 'group', title: 'SEO', options: {columns: 1}}],
  /*  groups: [{name: 'seo', title: 'SEO'}],*/
  preview: {
    select: {
      title: 'title',
      subtitle: 'lede',
    },
  },
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
      validation: (rule) => rule.required().min(3),
    }),
    defineField({
      type: 'array',
      name: 'alternateTitles',
      title: 'Alternate titles',
      of: [{type: 'string'}],
    }),
    defineField({
      type: 'text',
      name: 'lede',
      title: 'Lede',
      validation: (rule) => rule.required(),
    }),
    defineField({
      type: articleImage.name,
      name: 'image',
      title: 'Cover image',
      options: {
        collapsible: true,
      },
    }),
    defineField({
      name: 'body',
      type: 'array',
      /*      components: {
        input: (props: any) => {
          console.log(props.value)
          return props.renderDefault({...props, value: props.value?.slice(0, 8)})
        },
      },*/
      of: [
        defineArrayMember({
          type: 'block',
          //styles: [{title: 'Normal', value: 'normal'}],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
              {title: 'Code', value: 'code'},
            ] as any,
            annotations: [],
          },
        }),
        {type: articleImage.name},
        {type: 'code'},
        {type: timeline.name},
        {type: factBox.name},
        {type: todo.name},
        /*        {type: 'reference', to: [{type: 'sanity-ai.context'}]},*/
        /*        {type: mockObject1.name},*/
        /* {
          type: 'object',
          name: '$$markdown$$',
          fields: [
            {
              type: 'string',
              name: 'title',
              title: 'Title',
            },
          ],
        },*/
      ],
    }),
    defineField({
      name: 'plainBody',
      type: 'array',
      /*      components: {
        input: (props: any) => {
          console.log(props.value)
          return props.renderDefault({...props, value: props.value?.slice(0, 8)})
        },
      },*/
      of: [
        defineArrayMember({
          type: 'block',
          //styles: [{title: 'Normal', value: 'normal'}],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
              {title: 'Code', value: 'code'},
            ] as any,
            annotations: [],
          },
        }),
      ],
    }),
    defineField({
      name: 'alternateTakes',
      type: 'array',
      title: 'Alternate takes',
      of: [defineArrayMember({type: factBox.name}), defineArrayMember({type: timeline.name})],
    }),
    defineField({
      type: factBox.name,
      name: 'heroFactbox',
      title: 'Hero factbox',
      options: {
        collapsible: true,
        collapsed: true,
      },
    }),
    defineField({
      name: 'topics',
      type: 'array',
      title: 'Topics',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'number',
      type: 'array',
      title: 'Numbers',
      of: [{type: 'number'}],
    }),
    defineField({
      type: 'reference',
      name: 'ref',
      title: 'Ref',
      to: [{type: 'scrollBug'}],
    }),
    defineField({
      type: seoObject.name,
      name: 'seo',
      title: 'SEO',
      //group: 'seo',
    }),
  ],
})
