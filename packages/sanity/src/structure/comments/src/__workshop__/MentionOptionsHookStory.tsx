import React from 'react'
import {Card, Code} from '@sanity/ui'
import {useMentionOptions} from '../hooks'

const DOCUMENT = {
  _id: '1e1744ab-43d5-4fff-8a2a-28c58bf0434a',
  _type: 'author',
  _rev: '1',
  _createdAt: '2021-05-04T14:54:37Z',
  _updatedAt: '2021-05-04T14:54:37Z',
}

export default function MentionOptionsHookStory() {
  const {data, loading} = useMentionOptions({
    documentValue: DOCUMENT,
  })

  if (loading) return <div>Loading...</div>
  if (!data) return <div>No data</div>

  return (
    <Card height="fill" padding={4} overflow="auto">
      <Code language="javascript" size={1}>
        {JSON.stringify(data, null, 2)}
      </Code>
    </Card>
  )
}
