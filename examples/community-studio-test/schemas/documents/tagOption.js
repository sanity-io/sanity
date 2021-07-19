import React from 'react'
import Icon from '../components/icon'

export default {
  name: 'tagOption',
  title: 'Tag',
  type: 'document',
  icon: () => <Icon emoji="🏷️" />,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'value',
      title: 'Value',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      }
    }
  ]
}
