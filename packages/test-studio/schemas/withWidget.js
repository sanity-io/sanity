import React from 'react'

const SimpleWidget = props => {
  const {value = {}} = props
  return (
    <div>
      <div>This is the test widget</div>
      <div>I know about the document, like the title <em>{value.title}</em></div>
    </div>
  )
}

export default {
  name: 'withWidgetTest',
  type: 'document',
  title: 'With widget test',
  fieldsets: [{name: 'statistics', title: 'Statistics', options: {collapsable: true}}],
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'stats',
      type: 'widget',
      title: 'Stats from google analytics',
      description: 'Custom widget',
      select: {
        title: 'title'
      },
      component: SimpleWidget
    },
    {
      name: 'slug',
      type: 'string',
      title: 'Slug',
      fieldset: 'statistics'
    },
    {
      name: 'statsdf',
      type: 'widget',
      title: 'Stats from google analytics',
      description: 'Custom widget',
      select: {
        title: 'title'
      },
      component: SimpleWidget,
      fieldset: 'statistics'
    }
  ]
}
