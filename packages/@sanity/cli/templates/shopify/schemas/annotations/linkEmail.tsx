/**
 * Annotations are ways of marking up text in the block content editor.
 *
 * Read more: https://www.sanity.io/docs/customization#f924645007e1
 */
import {EnvelopeIcon} from '@sanity/icons'
import React from 'react'
import {defineField, defineType} from 'sanity'

export default defineType({
  title: 'Email',
  name: 'annotationLinkEmail',
  type: 'object',
  portableText: {
    icon: () => <EnvelopeIcon />,
    render: ({children}) => (
      <span>
        <EnvelopeIcon style={{marginRight: '0.2em', verticalAlign: 'text-bottom'}} />
        {children}
      </span>
    ),
  },
  fields: [
    // Email
    defineField({
      title: 'Email',
      name: 'email',
      type: 'email',
    }),
  ],
})
