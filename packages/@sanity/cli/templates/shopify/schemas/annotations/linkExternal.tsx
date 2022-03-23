/**
 * Annotations are ways of marking up text in the block content editor.
 *
 * Read more: https://www.sanity.io/docs/customization#f924645007e1
 */
import {EarthGlobeIcon} from '@sanity/icons'
import React from 'react'

export default {
  title: 'External Link',
  name: 'annotationLinkExternal',
  type: 'object',
  blockEditor: {
    icon: () => <EarthGlobeIcon />,
    render: ({children}) => (
      <span>
        <EarthGlobeIcon style={{marginRight: '0.2em', verticalAlign: 'text-bottom'}} />
        {children}
      </span>
    ),
  },
  initialValue: {
    newWindow: true,
  },
  fields: [
    {
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.required().uri({scheme: ['http', 'https']}),
    },
    // Open in a new window
    {
      title: 'Open in a new window?',
      name: 'newWindow',
      type: 'boolean',
    },
  ],
}
