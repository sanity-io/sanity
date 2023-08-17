import {range} from 'lodash'
import {RocketIcon} from '@sanity/icons'
import {CustomInputWithDefaultPresence} from './components/CustomInputWithDefaultPresence'
import {CustomInputWithDialogOverlay} from './components/CustomInputWithDialogOverlay'

export const objectWithNestedArray = {
  type: 'object',
  name: 'objectWithNestedArray',
  fields: [
    ...range(20).map((n) =>
      n % 2 === 0
        ? {type: 'string', name: `fieldNo${n}`}
        : {type: 'array', name: `arrayNo${n}`, of: [{type: 'objectWithNestedArray'}]},
    ),
  ],
}

export const collapsibleObject = {
  type: 'object',
  name: 'nestedCollapsibleObject',
  fields: [
    ...range(4).map((n) =>
      n % 2 === 0
        ? {type: 'string', name: `fieldNo${n}`}
        : {type: 'nestedCollapsibleObject', name: `nestedCollapsibleObject${n}`},
    ),
  ],
}

export default {
  name: 'presence',
  type: 'document',
  title: 'Presence test',
  description: 'A type made for testing different aspects of presence',
  icon: RocketIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.min(5).max(100),
    },
    {
      name: 'nested',
      type: 'object',
      fields: [
        {
          name: 'first',
          type: 'string',
        },
        {
          name: 'second',
          type: 'string',
        },
      ],
    },
    {
      name: 'array',
      type: 'array',
      of: [
        {
          type: 'string',
        },
      ],
    },
    {
      name: 'customInputWithDefaultPresence',
      title: 'Custom input with default presence',
      description:
        'This is a custom input component that delegates to the default presence component',
      type: 'object',
      fields: range(4).map((row) => ({
        type: 'object',
        name: `row${row}`,
        fields: range(8).map((cell) => ({name: `cell${cell}`, type: 'string'})),
      })),
      components: {input: CustomInputWithDefaultPresence},
    },
    {
      name: 'customInputWithDialog',
      title: 'Custom input with dialog and overlay',
      description: 'This is an example of how to use a presence overlay inside a dialog',
      type: 'object',
      fields: range(20).map((n) => ({type: 'string', name: `fieldNo${n}`})),
      components: {input: CustomInputWithDialogOverlay},
    },
    {
      name: 'collapsible',
      title: 'Collapsible',
      type: 'objectWithNestedArray',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'portableText',
      title: 'Portable text',
      type: 'array',
      of: [{type: 'block'}, {type: 'objectWithNestedArray'}],
    },
    {
      name: 'nestedArray',
      title: 'Nested array test',
      type: 'array',
      of: [{type: 'objectWithNestedArray'}],
    },
    {
      name: 'translations',
      title: 'Translations',
      type: 'object',
      fields: [
        {name: 'no', type: 'string', title: 'Norwegian (Bokmål)'},
        {name: 'nn', type: 'string', title: 'Norwegian (Nynorsk)'},
        {name: 'se', type: 'string', title: 'Swedish'},
      ],
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: {type: 'author', title: 'Author'},
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {hotspot: true},
    },
    {
      name: 'prologue',
      title: 'Prologue',
      type: 'string',
    },
    {
      name: 'address',
      type: 'object',
      fields: [
        {
          name: 'street',
          type: 'string',
        },
        {
          name: 'country',
          type: 'string',
        },
      ],
    },
    {
      name: 'reviews',
      title: 'Reviews',
      type: 'array',
      of: [{type: 'review'}],
    },
  ],
}
