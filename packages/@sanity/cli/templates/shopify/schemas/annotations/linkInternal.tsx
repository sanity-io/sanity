/**
 * Annotations are ways of marking up text in the block content editor.
 *
 * Read more: https://www.sanity.io/docs/customization#f924645007e1
 */
import {LinkIcon} from '@sanity/icons'
import React from 'react'
import {PAGE_REFERENCES} from '../../constants'

export default {
  title: 'Internal Link',
  name: 'annotationLinkInternal',
  type: 'object',
  blockEditor: {
    icon: () => <LinkIcon />,
    render: ({children}) => (
      <span>
        <LinkIcon style={{marginRight: '0.2em', verticalAlign: 'text-bottom'}} />
        {children}
      </span>
    ),
  },
  fields: [
    // Reference
    {
      name: 'reference',
      type: 'reference',
      weak: true,
      validation: (Rule) => Rule.required(),
      to: PAGE_REFERENCES,
    },
  ],
}
