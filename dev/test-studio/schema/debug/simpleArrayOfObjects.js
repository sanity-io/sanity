import {StackIcon} from '@sanity/icons'
import {ArrayWithInlineEditPOC} from 'sanity'

export const simpleArrayOfObjects = {
  name: 'simpleArrayOfObjects',
  type: 'document',
  title: 'Simple array of objects',
  icon: StackIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'arrayWithObjects',
      options: {collapsible: true, collapsed: true},
      title: 'Array with named objects',
      description: 'This array contains objects of type as defined inline',
      type: 'array',
      components: {input: ArrayWithInlineEditPOC},
      of: [
        {
          type: 'object',
          name: 'something',
          title: 'Something',
          options: {modal: 'inline'},
          fields: [
            {name: 'first', type: 'string', title: 'First string'},
            {name: 'second', type: 'string', title: 'Second string'},
          ],
          preview: {
            select: {title: 'first', subtitle: 'second'},
          },
        },
        {
          type: 'reference',
          title: 'A reference to an author',
          to: [{type: 'author'}],
        },
      ],
    },
    {
      name: 'arrayWithObjectsInlineEditSerially',
      options: {collapsible: true, collapsed: true, exclusive: true},
      title: 'Array with named objects',
      description: 'Can only be open one at a time',
      type: 'array',
      components: {input: ArrayWithInlineEditPOC},
      of: [
        {
          type: 'object',
          name: 'something',
          title: 'Something',
          options: {modal: 'inline'},
          fields: [
            {name: 'first', type: 'string', title: 'First string'},
            {name: 'second', type: 'string', title: 'Second string'},
          ],
          preview: {
            select: {title: 'first', subtitle: 'second'},
          },
        },
        {
          type: 'reference',
          title: 'A reference to an author',
          to: [{type: 'author'}],
        },
      ],
    },
  ],
}
