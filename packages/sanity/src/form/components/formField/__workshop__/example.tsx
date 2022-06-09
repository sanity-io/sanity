import type {ValidationMarker} from '@sanity/types'
import {Card, Code, Container, Flex, LayerProvider, TextInput} from '@sanity/ui'
import {useBoolean, useNumber, useString} from '@sanity/ui-workshop'
import React, {useCallback, useMemo, useState} from 'react'
import {ElementWithChangeBar} from '../../../../components/changeIndicators/ElementWithChangeBar'
import {useCurrentUser} from '../../../../datastores'
import type {FormFieldPresence} from '../../../../presence'
import {FormField} from '../FormField'

const DEBUG = false
const noop = () => undefined

export default function ExampleStory() {
  const inputId = 'test'
  const validationErrors = useBoolean('Validation errors', false, 'Props')
  const title = useString('Title', 'Title', 'Props')
  const description = useString('Description', 'Description', 'Props')
  const isChanged = useBoolean('Changed', false, 'Props')
  const level = useNumber('Level', 0, 'Props')
  const [focused, setFocused] = useState(false)
  const user = useCurrentUser()

  const presence: FormFieldPresence[] = useMemo(
    () =>
      user
        ? [
            {
              user,
              path: ['title'],
              sessionId: 'foo',
              lastActiveAt: new Date().toUTCString(),
            },
          ]
        : [],
    [user]
  )

  const validation: ValidationMarker[] = useMemo(
    () =>
      validationErrors
        ? [
            {
              level: 'error',
              item: {
                message: 'Something is not right',
                // children?: ValidationError[]
                // operation?: 'AND' | 'OR'
                paths: [],
                cloneWithMessage: noop as any,
              },
              path: [],
            },
          ]
        : [],
    [validationErrors]
  )

  const handleBlur = useCallback(() => setFocused(false), [])
  const handleFocus = useCallback(() => setFocused(true), [])

  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <Container width={1}>
        <LayerProvider>
          {/*<FormNodeProvider*/}
          {/*  inputId="test"*/}
          {/*  level={level}*/}
          {/*  path={['test']}*/}
          {/*  presence={presence}*/}
          {/*  type={{description, title} as any}*/}
          {/*  validation={validation}*/}
          {/*>*/}
          {/*  <FormField>*/}
          {/*    <ElementWithChangeBar isChanged={isChanged} hasFocus={focused}>*/}
          {/*      <TextInput id={inputId} onBlur={handleBlur} onFocus={handleFocus} />*/}
          {/*    </ElementWithChangeBar>*/}
          {/*  </FormField>*/}
          {/*</FormNodeProvider>*/}
        </LayerProvider>

        {DEBUG && (
          <Card marginTop={4} overflow="auto" padding={3} radius={2} scheme="dark">
            <Code language="json" size={1}>
              {JSON.stringify(user, null, 2)}
            </Code>
          </Card>
        )}
      </Container>
    </Flex>
  )
}
