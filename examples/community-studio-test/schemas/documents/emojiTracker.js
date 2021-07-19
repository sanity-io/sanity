import React from 'react'
import { format, parseISO } from 'date-fns'
import { Emoji } from 'emoji-mart'
import Icon from '../components/icon'

export default {
  name: 'emojiTracker',
  title: 'Emoji Tracker™',
  type: 'document',
  icon: () => <Icon emoji="👍" />,
  fields: [
    {
      name: 'date',
      title: 'Date',
      type: 'date',
      options: {
        dateFormat: 'DD/MM/YYYY'
      },
      readOnly: true
    },
    {
      name: 'summary',
      title: 'Summary',
      type: 'array',
      of: [{ type: 'emojiSummary' }],
      readOnly: true
    },
    {
      name: 'entries',
      title: 'Entries',
      type: 'array',
      of: [{ type: 'emojiEntry' }],
      readOnly: true
    }
  ],
  preview: {
    select: {
      date: 'date',
      entries: 'entries'
    },
    prepare({ date, entries }) {
      const totalEntries = entries.length
      const formattedDate = format(parseISO(date), 'dd/MM/yyyy')
      return {
        title: formattedDate,
        subtitle: `${totalEntries} emoji reactions`
      }
    }
  }
}
