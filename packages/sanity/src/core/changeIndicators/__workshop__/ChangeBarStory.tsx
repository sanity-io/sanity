import {Container, Flex, TextArea} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React from 'react'
import {ElementWithChangeBar} from '../ElementWithChangeBar'

export default function ChangeBarStory() {
  const isChanged = useBoolean('Changed', true, 'Props')

  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <Container width={0}>
        <ElementWithChangeBar isChanged={isChanged}>
          <TextArea rows={5} />
        </ElementWithChangeBar>
      </Container>
    </Flex>
  )
}
