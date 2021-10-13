import {DocumentIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Text} from '@sanity/ui'
import {useBoolean, useString} from '@sanity/ui-workshop'
import React from 'react'
import {InlinePreview} from '../'

export default function InlinePreviewStory() {
  const title = useString('Title', 'Inline object', 'Props')
  const withImage = useBoolean('With image', true, 'Props')

  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Container width={0}>
          <InlinePreview
            // eslint-disable-next-line react/jsx-no-bind
            media={() =>
              withImage ? <img src="https://source.unsplash.com/60x60/?face" /> : <DocumentIcon />
            }
            title={title}
          />
        </Container>
      </Flex>
    </Card>
  )
}
