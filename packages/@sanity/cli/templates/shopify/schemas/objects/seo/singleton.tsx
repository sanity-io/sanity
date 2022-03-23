import React from 'react'
import {IntentLink} from '@sanity/base/router'
import {CogIcon} from '@sanity/icons'

export default {
  name: 'seo.singleton',
  title: 'SEO',
  type: 'object',
  options: {
    collapsed: false,
    collapsible: true,
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) =>
        Rule.max(50).warning('Longer titles may be truncated by search engines'),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      validation: (Rule) =>
        Rule.max(150).warning('Longer descriptions may be truncated by search engines'),
    },
    {
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      // TODO: create separate component / clean this up further with sanity-ui
      description: (
        <>
          Used for both search engine results and social cards.
          <br />
          If empty, displays the image defined in{' '}
          <IntentLink
            intent="edit"
            params={{id: 'settings'}}
            style={{marginLeft: '0.2em', whiteSpace: 'nowrap'}}
          >
            <CogIcon />
            <span style={{marginLeft: '0.3em'}}>Settings</span>
          </IntentLink>
          .
        </>
      ),
    },
  ],
}
