import React from 'react'
import {FormInput, ObjectInputProps} from 'sanity'
import {Grid} from '@sanity/ui'

export const formInputDebug = {
  name: 'formInputDebug',
  type: 'document',
  title: 'Form Input debug example',
  components: {
    input: CustomObjectInput,
  },

  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        {
          name: 'City',
          type: 'string',
        },
        {
          name: 'country',
          type: 'object',
          fields: [
            {name: 'displayName', type: 'string'},
            {name: 'code', type: 'string'},
          ],
        },
      ],
    },
    {
      name: 'arrayWithObjects',
      options: {collapsible: true, collapsed: true},
      title: 'Array with named objects',
      type: 'array',
      of: [
        {
          type: 'object',
          title: 'Something',
          fields: [
            {name: 'first', type: 'string', title: 'First string'},
            {name: 'second', type: 'string', title: 'Second string'},
          ],
        },
      ],
    },
  ],
}

function CustomObjectInput(props: ObjectInputProps) {
  return (
    <Grid gap={4} columns={2}>
      <FormInput {...props} absolutePath={['arrayWithObjects']} />
      <FormInput {...props} absolutePath={['address', 'country']} />
    </Grid>
  )
}
