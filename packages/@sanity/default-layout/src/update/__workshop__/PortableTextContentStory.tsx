import {Card, Container} from '@sanity/ui'
import React from 'react'
import {PortableTextContent} from '../PortableTextContent'
import {CHANGELOG_MOCK_DATA} from './_mock/mockData'

export default function PortableTextContentStory() {
  const description = CHANGELOG_MOCK_DATA.changelog
    .map((c) => c.changeItems)
    .flat()
    .map((d) => d.description)
    .flat()

  return (
    <Container width={1} padding={4}>
      <Card padding={4} shadow={1} radius={2}>
        <PortableTextContent value={description as any} />
      </Card>
    </Container>
  )
}
