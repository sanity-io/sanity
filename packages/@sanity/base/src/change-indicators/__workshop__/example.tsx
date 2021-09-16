import {Container, Flex, TextArea} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {useCallback, useState} from 'react'
import {ChangeBar} from '../ChangeBar'

export default function ExampleStory() {
  const isChanged = useBoolean('Changed', true, 'Props')
  const [focused, setFocused] = useState(false)

  const handleBlur = useCallback(() => setFocused(false), [])
  const handleFocus = useCallback(() => setFocused(true), [])

  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <Container width={0}>
        <ChangeBar isChanged={isChanged} hasFocus={focused}>
          <TextArea onBlur={handleBlur} onFocus={handleFocus} rows={5} />
        </ChangeBar>
      </Container>
    </Flex>
  )
}
