import React from 'react'
import {FieldProps, PreviewProps, SanityClient, defineField, defineType} from 'sanity'

interface Author {
  _id: string
  title: string
}

export function MyField(props: PreviewProps) {
  return (
    <div
      data-testid="my-field-custom"
      style={{
        backgroundColor: 'red',
        // position: 'relative',
      }}
    >
      {props.renderDefault(props)}
    </div>
  )
}

const getAuthors = (client: SanityClient) => {
  const query = `*[_type == "author"][0...20]{_id}`

  return client.fetch(query)
}

export const virtualizationDebug = defineType({
  name: 'virtualizationDebug',
  title: 'Virtualization Debug',
  type: 'document',
  components: {
    preview: MyField,
  },
  preview: {
    select: {
      title: 'title',
    },
  },
  groups: [
    {
      name: 'array',
      title: 'Array',
    },
    {
      name: 'objects',
      title: 'Objects',
    },
  ],

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'array',
      title: 'Array',
      type: 'array',
      group: 'array',
      components: {
        preview: MyField,
      },
      of: [
        {
          name: 'author',
          type: 'author',
        },
      ],
    }),
    defineField({
      name: 'pte',
      title: 'PTE',
      type: 'array',
      group: 'array',
      of: [
        {
          type: 'block',
        },
        {
          name: 'authors',
          type: 'object',
          fields: [
            {
              type: 'array',
              of: [{type: 'reference', to: [{type: 'author'}]}],
              name: 'references',
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
      initialValue: async (_, context) => {
        const {getClient} = context
        const client = getClient({apiVersion: '2022-12-07'})
        const authors = await getAuthors(client)

        return [
          {
            _type: 'authors',
            references: authors.map((author: Author) => ({
              _type: 'reference',
              _ref: author._id,
            })),
          },
        ]
      },
    }),
    defineField({
      name: 'positionRelative',
      title: 'Array with Position Relative',
      type: 'array',
      group: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'author'}],
        },
      ],
      initialValue: async (_, context) => {
        const {getClient} = context
        const client = getClient({apiVersion: '2022-12-07'})
        const authors = await getAuthors(client)

        return authors.map((author: Author) => ({
          _type: 'reference',
          _ref: author._id,
        }))
      },
      components: {
        preview: MyField,
      },
    }),
    defineField({
      name: 'arrayList',
      title: 'Array List with no customization',
      type: 'array',
      group: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'author'}],
        },
      ],
      initialValue: async (_, context) => {
        const {getClient} = context
        const client = getClient({apiVersion: '2022-12-07'})
        const authors = await getAuthors(client)

        return authors.map((author: any) => ({
          _type: 'reference',
          _ref: author._id,
        }))
      },
    }),
    defineField({
      name: 'arrayInPopover',
      title: 'Array in Popover',
      type: 'array',
      group: 'array',
      of: [
        {
          type: 'playlist',
        },
      ],
      options: {
        modal: {type: 'popover'},
      },
      initialValue: () => {
        const arr = new Array(10).fill(null)
        return [
          {
            _type: 'playlist',
            name: 'Open Me!',
            tracks: arr.map((_, i) => ({
              _type: 'playlistTrack',
              name: `Track ${i}`,
            })),
          },
        ]
      },
    }),
    defineField({
      name: 'arrayInDialog',
      title: 'Array in Dialog',
      type: 'array',
      group: 'array',
      of: [
        {
          type: 'playlist',
        },
      ],
      options: {
        modal: {type: 'dialog'},
      },
      initialValue: () => {
        const arr = new Array(10).fill(null)
        return [
          {
            _type: 'playlist',
            name: 'Open Me!',
            tracks: arr.map((_, i) => ({
              _type: 'playlistTrack',
              name: `Track ${i}`,
            })),
          },
        ]
      },
    }),
    defineField({
      name: 'arrayInObjectRef',
      title: 'Array in Object References',
      type: 'object',
      group: 'objects',
      options: {
        collapsible: true,
      },
      fields: [
        defineField({
          name: 'arrayList',
          title: 'Array List with no customization',
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
            const authors = await getAuthors(client)

            return authors.map((author: any) => ({
              _type: 'reference',
              _ref: author._id,
            }))
          },
        }),
      ],
    }),
    defineField({
      name: 'arrayInObject',
      title: 'Array in Object Arrays',
      type: 'object',
      group: 'objects',
      options: {
        collapsible: true,
      },
      fields: [
        defineField({
          name: 'arrayList',
          title: 'Array List with no customization',
          type: 'array',
          of: [
            {
              type: 'playlist',
            },
          ],
          initialValue: () => {
            const arr = new Array(10).fill(null)
            return arr.map((_, i) => ({
              _type: 'playlist',
              name: `Playlist ${i}`,
            }))
          },
        }),
      ],
    }),
  ],
})
