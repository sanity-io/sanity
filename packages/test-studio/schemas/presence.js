import BookIcon from 'react-icons/lib/fa/book'
import {CustomInputWithDefaultPresence} from '../src/components/CustomInputWithDefaultPresence'
import {CustomInputWithCustomPresence} from '../src/components/CustomInputWithCustomPresence'

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
      name: 'customInputWithDefaultPresence',
      title: 'Custom input with default presence',
      description:
        'This is a custom input component that delegates to the default presence component',
      type: 'array',
      of: [{type: 'string'}],
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
      name: 'reviews',
      title: 'Reviews',
      type: 'array',
      of: [{type: 'review'}]
    }
  ]
}
