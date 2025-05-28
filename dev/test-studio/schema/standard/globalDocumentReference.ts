import {BookIcon, MoonIcon, UserIcon} from '@sanity/icons'
import {defineType} from 'sanity'

export const createGlobalDocumentReferenceSubtype = (projectId: string) =>
  defineType({
    type: 'globalDocumentReference',
    name: 'globalDocumentSubtype',
    title: 'Subtype of global document references',
    resourceType: 'dataset',
    resourceId: `${projectId}.blog`,
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

export default function createGDRType(projectId: string) {
  return defineType({
    name: 'globalDocumentReferenceTest',
    type: 'document',
    title: 'Global document reference test',
    description: 'Test cases for global document references',
    icon: MoonIcon,
    fields: [
      {name: 'title', type: 'string'},
      {
        name: 'bookInPlayground',
        title: 'Reference to book in the "playground" dataset',
        type: 'globalDocumentReference',
        resourceType: 'dataset',
        resourceId: `${projectId}.blog`,
        weak: true,
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
        type: 'globalDocumentReference',
        resourceType: 'dataset',
        resourceId: `${projectId}.blog`,
        weak: true,
        studioUrl: `${document.location.protocol}//${document.location.host}/staging`,
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
        title: 'GDR in PTE',
        name: 'portableText',
        type: 'array',
        of: [
          {type: 'block'},
          {
            title: 'GDR subtype test',
            name: 'globalDocumentSubtype',
            type: 'globalDocumentSubtype',
          },
        ],
      },
      {
        title: 'GDR in array',
        name: 'array',
        type: 'array',
        of: [
          {
            title: 'GDR subtype test',
            name: 'globalDocumentSubtype',
            type: 'globalDocumentSubtype',
          },
        ],
      },
      {
        title: 'GDR subtype test',
        name: 'globalDocumentSubtype',
        type: 'globalDocumentSubtype',
      },
      {
        name: 'initialValueTest',
        type: 'globalDocumentReference',
        resourceType: 'dataset',
        resourceId: `${projectId}.blog`,
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
        initialValue: () => ({
          _type: 'reference',
          _ref: `dataset:${projectId}.blog:4203c6bd-98c2-418e-9558-3ed56ebaf1d8`,
          _weak: true,
        }),
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
}
