import React from 'react'
import Icon from '../components/icon'
import OpenInSlack from '../components/openInSlack'

export default {
  type: 'document',
  name: 'contribution',
  title: 'Contribution',
  liveEdit: true,
  icon: () => <Icon emoji="🦄" />,
  fields: [
    {
      title: 'Permalink',
      type: 'url',
      name: 'permalink',
      readOnly: true,
      inputComponent: OpenInSlack,
    },
    {
      title: 'Contribution',
      type: 'array',
      name: 'contribution',
      of: [{type: 'message'}],
      readOnly: true,
    },
    {
      title: 'Channel name',
      type: 'string',
      name: 'channelName',
      readOnly: true,
    },
    {
      title: 'Author name',
      type: 'string',
      name: 'authorName',
      readOnly: true,
    },
    {
      title: 'Author Slack ID',
      type: 'string',
      name: 'authorSlackId',
      readOnly: true,
    },
    {
      title: 'Added by',
      type: 'string',
      name: 'addedBy',
      readOnly: true,
    },
    {
      title: 'Thread',
      type: 'array',
      name: 'thread',
      of: [{type: 'message'}],
      readOnly: true,
    },
  ],
  preview: {
    select: {
      authorName: 'authorName',
      channelName: 'channelName',
      contribution: 'contribution.0.content',
    },
    prepare({authorName, channelName, contribution}) {
      return {
        title: contribution,
        subtitle: `${authorName && `${authorName} `} in ${channelName && `#${channelName}`}`,
      }
    },
  },
}
