import React from 'react'

export default {
  name: 'simpleStats',
  title: 'Simple stats',
  type: 'object',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string'
    },
    {
      name: 'absolute',
      title: 'Absolute',
      type: 'number'
    },
    {
      name: 'percentage',
      title: 'Percentage',
      type: 'number'
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'absolute'
    }
  }
}
