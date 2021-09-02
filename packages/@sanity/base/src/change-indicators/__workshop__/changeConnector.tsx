import {Path} from '@sanity/types/src'
import {Container, Flex, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled from 'styled-components'
import {ChangeIndicatorProvider} from '../ChangeIndicator'
import {ChangeConnectorRoot} from '../overlay/ChangeConnectorRoot'

const Root = styled(ChangeConnectorRoot)`
  height: 100%;
  overflow: auto;
  outline: 1px solid var(--card-border-color);
  position: relative;
`

export default function ChangeConnectorStory() {
  const isReviewChangesOpen = true
  const onOpenReviewChanges = useCallback(() => undefined, [])
  const onSetFocus = useCallback(() => undefined, [])

  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <Container height="fill" style={{maxHeight: 320}} width={0}>
        <Root
          isReviewChangesOpen={isReviewChangesOpen}
          onOpenReviewChanges={onOpenReviewChanges}
          onSetFocus={onSetFocus}
        >
          <Flex gap={3} padding={4}>
            <Stack
              flex={1}
              padding={4}
              space={4}
              style={{outline: '1px solid var(--card-border-color)'}}
            >
              <DebugField path={['title']} focusPath={['title']} value="Test" compareValue="Test">
                <Text>Field A</Text>
              </DebugField>
              <Text>Field B</Text>
              <Text>Field C</Text>
              <Text>Field D</Text>
              <Text>Field E</Text>
              <Text>Field F</Text>
              <Text>Field G</Text>
              <Text>Field H</Text>
              <Text>Field I</Text>
              <Text>Field J</Text>
              <Text>Field K</Text>
              <Text>Field L</Text>
              <Text>Field M</Text>
              <Text>Field N</Text>
            </Stack>

            <Stack
              flex={1}
              padding={4}
              space={4}
              style={{outline: '1px solid var(--card-border-color)'}}
            >
              <DebugField path={['title']} focusPath={['title']} value="Test" compareValue="Test">
                <Text>Field A</Text>
              </DebugField>
              <Text>Field B</Text>
              <Text>Field C</Text>
              <Text>Field D</Text>
              <Text>Field E</Text>
              <Text>Field F</Text>
              <Text>Field G</Text>
              <Text>Field H</Text>
              <Text>Field I</Text>
              <Text>Field J</Text>
              <Text>Field K</Text>
              <Text>Field L</Text>
              <Text>Field M</Text>
              <Text>Field N</Text>
            </Stack>
          </Flex>
        </Root>
      </Container>
    </Flex>
  )
}

function DebugField(props: {
  children?: React.ReactNode
  focusPath: Path
  path: Path
  value: unknown
  compareValue: unknown
}) {
  const {children, focusPath, path, value, compareValue} = props

  return (
    <ChangeIndicatorProvider
      path={path}
      focusPath={focusPath}
      value={value}
      compareValue={compareValue}
    >
      <div style={{outline: '1px solid var(--card-border-color)'}}>{children}</div>
    </ChangeIndicatorProvider>
  )
}
