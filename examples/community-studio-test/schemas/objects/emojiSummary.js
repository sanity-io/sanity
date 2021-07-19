import React from 'react'
import { Emoji } from 'emoji-mart'

export default {
  name: 'emojiSummary',
  title: 'Emoji summary',
  type: 'object',
  fields: [
    {
      name: 'shortCode',
      title: 'Shortcode',
      type: 'string'
    },
    {
      name: 'colonCode',
      title: 'Coloncode',
      type: 'string'
    },
    {
      name: 'count',
      title: 'Count',
      type: 'number'
    }
  ],
  preview: {
    select: {
      colonCode: 'colonCode',
      shortCode: 'shortCode',
      count: 'count'
    },
    prepare({ colonCode, shortCode, count }) {
      return {
        title: shortCode,
        subtitle: `Count: ${count}`,
        media: <Emoji emoji={colonCode} size={24} />
      }
    }
  }
}
