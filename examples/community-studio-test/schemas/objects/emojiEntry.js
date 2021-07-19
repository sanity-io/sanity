import React from 'react'
import { Emoji } from 'emoji-mart'

export default {
  name: 'emojiEntry',
  title: 'Emoji entry',
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
      name: 'authorName',
      title: 'Author name',
      type: 'string'
    },
    {
      name: 'authorSlackId',
      title: 'Author Slack ID',
      type: 'string'
    },
    {
      title: 'Channel name',
      type: 'string',
      name: 'channelName'
    },
    {
      name: 'timestamp',
      title: 'Timestamp',
      type: 'string'
    },
    {
      title: 'Permalink',
      type: 'url',
      name: 'permalink'
    }
  ],
  preview: {
    select: {
      authorName: 'authorName',
      channelName: 'channelName',
      colonCode: 'colonCode',
      shortCode: 'shortCode',
      timestamp: 'timestamp'
    },
    prepare({ authorName, channelName, colonCode, shortCode, timestamp }) {
      const timeString = new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return {
        title: shortCode,
        subtitle: `${authorName} in #${channelName} at ${timeString}`,
        media: <Emoji emoji={colonCode} size={24} />
      }
    }
  }
}
