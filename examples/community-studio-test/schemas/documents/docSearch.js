import React from 'react'
import { add, format, parseISO } from 'date-fns'
import Icon from '../components/icon'

export default {
  name: 'docSearch',
  title: 'Doc search stats',
  type: 'document',
  icon: () => <Icon emoji="🔍" />,
  fields: [
    {
      name: 'week',
      title: 'Week',
      type: 'date',
      options: {
        dateFormat: 'w'
      }
    },
    {
      name: 'mostPopular',
      title: 'Most popular searches',
      type: 'array',
      of: [{ type: 'searchEntry' }],
      options: {
        sortable: false
      }
    },
    {
      name: 'noResults',
      title: 'No results',
      type: 'array',
      of: [{ type: 'searchEntry' }],
      options: {
        sortable: false
      }
    }
  ],
  orderings: [
    {
      title: 'Week number',
      name: 'weekNumberDesc',
      by: [
        {field: 'week', direction: 'desc'}
      ]
    }
  ],
  preview: {
    select: {
      week: 'week'
    },
    prepare({ week }) {
      const weekNumber = format(parseISO(week), 'w')
      const startOfWeek = format(add(parseISO(week), {days: 1}), 'dd/MM/yyyy')
      const endOfWeek = format(add(parseISO(week), {days: 7}), 'dd/MM/yyyy')
      return {
        title: `Week ${weekNumber}`,
        subtitle: `${startOfWeek} - ${endOfWeek}`
      }
    }
  }
}
