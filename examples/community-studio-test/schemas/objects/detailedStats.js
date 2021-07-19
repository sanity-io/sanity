import React from 'react'

export default {
  name: 'detailedStats',
  title: 'Detailed stats',
  type: 'object',
  fields: [
    {
      name: 'average',
      title: 'Average',
      type: 'number'
    },
    {
      name: 'lowerQuartile',
      title: 'First quartile',
      type: 'number'
    },
    {
      name: 'minimum',
      title: 'Minimum',
      type: 'number'
    },
    {
      name: 'median',
      title: 'Median',
      type: 'number'
    },
    {
      name: 'upperQuartile',
      title: 'Upper quartile',
      type: 'number'
    },
    {
      name: 'maximum',
      title: 'Maximum',
      type: 'number'
    },
  ]
}
