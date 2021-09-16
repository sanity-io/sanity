import {DocumentIcon, EditIcon} from '@sanity/icons'
import {Card, Container, Flex, Text} from '@sanity/ui'
import {useBoolean, useString} from '@sanity/ui-workshop'
import React from 'react'
import {DefaultPreview} from '../defaultPreview'

export default function ExampleStory() {
  const title = useString('Title', 'Title', 'Props')
  const subtitle = useString('Subtitle', 'Subtitle', 'Props')
  const selected = useBoolean('Selected', false, 'Props')

  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Container width={0}>
          <Card data-as="button" padding={2} radius={3} selected={selected}>
            <DefaultPreview
              media={<DocumentIcon />}
              status={
                <Text muted size={1}>
                  <EditIcon />
                </Text>
              }
              subtitle={subtitle}
              title={title}
            />
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
