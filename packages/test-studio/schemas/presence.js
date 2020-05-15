import BookIcon from 'react-icons/lib/fa/book'
import {CustomInputWithDefaultPresence} from '../src/components/CustomInputWithDefaultPresence'
import {CustomInputWithCustomPresence} from '../src/components/CustomInputWithCustomPresence'
import {CustomInputWithDialogOverlay} from '../src/components/CustomInputWithDialogOverlay'
import {range} from 'lodash'

export const objectWithNestedArray = {
  type: 'object',
  name: 'objectWithNestedArray',
  fields: range(20).map(n =>
    n % 2 == 0
      ? {type: 'string', name: `fieldNo${n}`}
      : {type: 'array', name: `arrayNo${n}`, of: [{type: 'objectWithNestedArray'}]}
  )
}
export default {
  name: 'presence',
  type: 'document',
  title: 'Presence test',
  description: 'A type made for testing different aspects of presence',
  icon: BookIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.min(5).max(100)
    },
    {
      name: 'nested',
      type: 'object',
      fields: [
        {
          name: 'first',
          type: 'string'
        },
        {
          name: 'second',
          type: 'string'
        }
      ]
    },
    {
      name: 'array',
      type: 'array',
      of: [
        {
          type: 'string'
        }
      ]
    },
    {
      name: 'customInputWithDefaultPresence',
      title: 'Custom input with default presence',
      description:
        'This is a custom input component that delegates to the default presence component',
      type: 'object',
      fields: range(4).map(row => ({
        type: 'object',
        name: `row${row}`,
        fields: range(8).map(cell => ({name: `cell${cell}`, type: 'string'}))
      })),
      inputComponent: CustomInputWithDefaultPresence
    },
    {
      name: 'customInputWithCustomPresence',
      title: 'Custom input with custom presence',
      description:
        'This uses a custom presence component that assigns a random animal emoji to each user',
      type: 'array',
      of: [{type: 'string'}],
      inputComponent: CustomInputWithCustomPresence
    },
    {
      name: 'customInputWithDialog',
      title: 'Custom input with dialog and overlay',
      description:
        'This uses a custom presence component that assigns a random animal emoji to each user',
      type: 'object',
      fields: range(20).map(n => ({type: 'string', name: `fieldNo${n}`})),
      inputComponent: CustomInputWithDialogOverlay
    },
    {
      name: 'nestedArray',
      title: 'Nested array test',
      type: 'array',
      of: [{type: 'objectWithNestedArray'}]
    },
    {
      name: 'translations',
      title: 'Translations',
      type: 'object',
      fields: [
        {name: 'no', type: 'string', title: 'Norwegian (Bokmål)'},
        {name: 'nn', type: 'string', title: 'Norwegian (Nynorsk)'},
        {name: 'se', type: 'string', title: 'Swedish'}
      ]
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: {type: 'author', title: 'Author'}
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {hotspot: true}
    },
    {
      name: 'prologue',
      title: 'Prologue',
      type: 'string'
    },
    {
      name: 'address',
      type: 'object',
      fields: [
        {
          name: 'street',
          type: 'string'
        },
        {
          name: 'country',
          type: 'string'
        }
      ]
    },
    {
      name: 'reviews',
      title: 'Reviews',
      type: 'array',
      of: [{type: 'review'}]
    }
  ]
}
