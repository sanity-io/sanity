import {Container, Flex, TextArea} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {useCallback, useState} from 'react'
import {ElementWithChangeBar} from '../changeIndicators/ElementWithChangeBar'

export default function ChangeBarStory() {
  const isChanged = useBoolean('Changed', true, 'Props')
  const [focused, setFocused] = useState(false)

  const handleBlur = useCallback(() => setFocused(false), [])
  const handleFocus = useCallback(() => setFocused(true), [])

  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <Container width={0}>
        <ElementWithChangeBar isChanged={isChanged} hasFocus={focused}>
          <TextArea onBlur={handleBlur} onFocus={handleFocus} rows={5} />
        </ElementWithChangeBar>
      </Container>
    </Flex>
  )
}
