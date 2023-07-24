import React from 'react'
import {FieldProps, defineField, defineType} from 'sanity'

export function MyField(props: FieldProps) {
  return (
    <div data-testid="my-field-relative" style={{position: 'relative'}}>
      {props.renderDefault(props)}
    </div>
  )
}

export const virtualizationCustomComponent = defineType({
  name: 'virtualizationCustomComponent',
  title: 'Virtualization Custom Component',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'spacerBlock',
      title: 'Spacer Block',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'positionRelative',
      title: 'Array with Position Relative',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'author'}],
        },
      ],
      initialValue: async (_, context) => {
        const {getClient} = context
        const client = getClient({apiVersion: '2022-12-07'})

        const query = `*[_type == "author"][0...50]{_id}`

        const authors = await client.fetch(query)
        return authors.map((author: any) => ({
          _type: 'reference',
          _ref: author._id,
        }))
      },
      components: {
        field: MyField,
      },
    }),
  ],
})
