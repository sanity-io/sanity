import {UserIcon, MoonIcon, BookIcon} from '@sanity/icons'
import {defineType} from 'sanity'

export const crossDatasetSubtype = defineType({
  type: 'crossDatasetReference',
  name: 'crossDatasetSubtype',
  title: 'Subtype of cross dataset references',
  dataset: 'playground',
  to: [
    {
      type: 'book',
      icon: BookIcon,
      preview: {
        select: {
          title: 'title',
          media: 'coverImage',
        },
        prepare(val) {
          return {
            title: val.title,
            media: val.coverImage,
          }
        },
      },
    },
  ],
})

export default defineType({
  name: 'crossDatasetReferenceTest',
  type: 'document',
  title: 'Cross dataset reference test',
  description: 'Test cases for cross dataset references',
  icon: MoonIcon,
  fields: [
    {name: 'title', type: 'string'},
    {
      name: 'bookInPlayground',
      title: 'Reference to book in the "playground" dataset',
      type: 'crossDatasetReference',
      dataset: 'playground',
      studioUrl: ({id, type}) => {
        return type
          ? `${document.location.protocol}//${document.location.host}/playground/content/${type};${id}`
          : null
      },
      to: [
        {
          type: 'book',
          icon: BookIcon,
          preview: {
            select: {
              title: 'title',
              subtitle: 'descriptionMd',
              media: 'coverImage',
            },
            prepare(val) {
              return {
                title: val.title,
                subtitle: val.subtitle,
                media: val.coverImage,
              }
            },
          },
        },
      ],
    },
    {
      title: 'Reference to book or author in the "playground" dataset',
      name: 'bookOrAuthorInPlayground',
      type: 'crossDatasetReference',
      dataset: 'playground',
      studioUrl: ({id, type}) => {
        return type
          ? `${document.location.protocol}//${document.location.host}/playground/content/${type};${id}`
          : null
      },
      to: [
        {
          type: 'book',
          icon: BookIcon,
          preview: {
            select: {
              title: 'title',
              subtitle: 'descriptionMd',
              coverImage: 'coverImage',
            },
            prepare(val) {
              return {
                title: val.title,
                subtitle: val.subtitle,
                media: val.coverImage,
              }
            },
          },
        },
        {
          type: 'author',
          icon: UserIcon,
          preview: {
            select: {
              title: 'name',
            },
            prepare(val) {
              return {
                title: val.title,
                media: val.media,
              }
            },
          },
        },
      ],
    },
    {
      title: 'Cross Dataset reference in PTE',
      name: 'portableText',
      type: 'array',
      of: [
        {type: 'block'},
        {
          title: 'Cross Dataset reference subtype test',
          name: 'crossDatasetSubtype',
          type: 'crossDatasetSubtype',
        },
      ],
    },
    {
      title: 'Cross Dataset reference in array',
      name: 'array',
      type: 'array',
      of: [
        {
          title: 'Cross Dataset reference subtype test',
          name: 'crossDatasetSubtype',
          type: 'crossDatasetSubtype',
        },
      ],
    },
    {
      title: 'Cross Dataset reference subtype test',
      name: 'crossDatasetSubtype',
      type: 'crossDatasetSubtype',
    },
  ],
  preview: {
    select: {
      title: 'title',
      authorRefName: 'bookOrAuthorInPlayground.name',
      authorBff: 'bookOrAuthorInPlayground.bestFriend.name',
      bookRefTitle: 'bookOrAuthorInPlayground.title',
    },
    prepare(values) {
      return {
        title: values.title,
        subtitle: [
          values.authorRefName
            ? `Author: ${values.authorRefName} (${`Bff: ${values.authorBff || 'none'}`})`
            : '',
          values.bookRefTitle ? `Book title: ${values.bookRefTitle}` : '',
        ]
          .filter(Boolean)
          .join(', '),
      }
    },
  },
})
