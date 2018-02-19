import React from 'react'

export default {
  name: 'slugsTest',
  type: 'document',
  title: 'Slugs test',
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current'
    },
    prepare: ({title, subtitle}) => {
      return {
        title: title,
        subtitle: <span style={{fontFamily: 'monospace'}}>{`/${subtitle}/`}</span>
      }
    }
  },
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'slug',
      type: 'slug',
      title: 'Normal slug',
      description: 'This is a slug field that should update according to current title',
      options: {
        source: 'title',
        maxLength: 96,
        auto: true,
      }
    },
    {
      name: 'slugWithFunction',
      type: 'slug',
      title: 'Slug with function to get source',
      description: 'This is a slug field that should update according to current title',
      options: {
        source: document => document.title,
        maxLength: 96,
        auto: true,
      }
    },
    {
      name: 'slugWithSlugify',
      type: 'slug',
      title: 'Custom slugify function',
      description: 'This is a slug field that should update according to current title',
      options: {
        source: 'title',
        slugify: (input, value) => {
          return encodeURI(`${input.name}_${value}`).toLocaleLowerCase()
        },
        maxLength: 96,
        auto: true,
      }
    }
  ]
}
