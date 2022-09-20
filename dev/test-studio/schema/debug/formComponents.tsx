import {defineType} from 'sanity'
import {Card} from '@sanity/ui'
import React from 'react'

export function ISBNInput() {
  return (
    <Card padding={3} tone="default">
      ISBNInput
    </Card>
  )
}

export const formComponents = defineType({
  type: 'document',
  name: 'formComponents',
  title: 'Form components',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'object',
      name: 'libraryBook',
      title: 'Library book',

      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'string',
          name: 'isbn',
          components: {
            input: ISBNInput,
          },
        },
      ],
    },
  ],
})
