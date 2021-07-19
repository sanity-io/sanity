import React from 'react'
import Icon from '../components/icon'

export default {
  name: 'searchEntry',
  title: 'Search entry',
  type: 'object',
  icon: () => <Icon emoji="🔍" />,
  fields: [
    {
      name: 'term',
      title: 'Term',
      type: 'string'
    },
    {
      name: 'searches',
      title: 'Searches',
      type: 'number'
    },
    {
      name: 'matches',
      title: 'Matches',
      type: 'number',
    }
  ],
  preview: {
    select: {
      title: 'term',
      searches: 'searches',
      matches: 'matches'
    },
    prepare({ title, searches, matches }) {
      matches = matches ? `, ${matches} matches` : ''
      return {
        title,
        subtitle: `${searches} searches${matches}`
      }
    }
  }
}
