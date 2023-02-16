import {Path} from '@sanity/types'
import {Card, Container, Flex, LayerProvider, Stack, Text} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import styled from 'styled-components'
import {ScrollContainer} from '../../components/scroll'
import {ChangeFieldWrapper} from '../ChangeFieldWrapper'
import {ChangeIndicator} from '../ChangeIndicator'
import {ChangeConnectorRoot} from '../overlay/ChangeConnectorRoot'

const TestContainer = styled(Container).attrs({
  height: 'fill',
  width: 1,
})`
  max-height: 320px;
`

const Root = styled(ChangeConnectorRoot)`
  height: 100%;
  outline: 1px solid var(--card-border-color);
  position: relative;
`

export default function ChangeConnectorStory() {
  const isReviewChangesOpen = true
  const onOpenReviewChanges = useCallback(() => undefined, [])
  const onSetFocus = useCallback(() => undefined, [])
  const [focusPath, setFocusPath] = useState<Path>([])

  return (
    <LayerProvider>
      <Card height="fill" tone="transparent">
        <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
          <TestContainer>
            <Root
              isReviewChangesOpen={isReviewChangesOpen}
              onOpenReviewChanges={onOpenReviewChanges}
              onSetFocus={onSetFocus}
            >
              <Flex height="fill">
                <Card
                  as={ScrollContainer}
                  data-ui="ScrollContainer"
                  flex={1}
                  overflow="auto"
                  padding={5}
                  style={{position: 'relative'}}
                >
                  <Stack space={9}>
                    <DebugFormField
                      path={['a']}
                      focusPath={focusPath}
                      setFocusPath={setFocusPath}
                      value="A"
                      compareValue="B"
                    >
                      <Text>Field A</Text>
                    </DebugFormField>
                    <DebugFormField
                      path={['b']}
                      focusPath={focusPath}
                      setFocusPath={setFocusPath}
                      value="B"
                      compareValue="C"
                    >
                      <Text>Field B</Text>
                    </DebugFormField>
                    <DebugFormField
                      path={['c']}
                      focusPath={focusPath}
                      setFocusPath={setFocusPath}
                      value="C"
                      compareValue="D"
                    >
                      <Text>Field C</Text>
                    </DebugFormField>
                  </Stack>
                </Card>

                <Card
                  as={ScrollContainer}
                  data-ui="ScrollContainer"
                  borderLeft
                  flex={1}
                  overflow="auto"
                  padding={5}
                  style={{position: 'relative'}}
                >
                  <Stack flex={1} space={9}>
                    <DebugDiffField path={['a']}>
                      <Text>Diff A</Text>
                    </DebugDiffField>
                    <DebugDiffField path={['b']}>
                      <Text>Diff B</Text>
                    </DebugDiffField>
                    <DebugDiffField path={['c']}>
                      <Text>Diff C</Text>
                    </DebugDiffField>
                  </Stack>
                </Card>
              </Flex>
            </Root>
          </TestContainer>
        </Flex>
      </Card>
    </LayerProvider>
  )
}

function DebugFormField(props: {
  children?: React.ReactNode
  focusPath: Path
  path: Path
  value: unknown
  compareValue: unknown
  setFocusPath: (p: Path) => void
}) {
  const {children, focusPath, path, value, compareValue, setFocusPath} = props
  const handleBlur = useCallback(() => setFocusPath([]), [setFocusPath])
  const handleFocus = useCallback(() => setFocusPath(path), [path, setFocusPath])

  return (
    <ChangeIndicator hasFocus={false} path={path} isChanged={false}>
      <Card border onBlur={handleBlur} onFocus={handleFocus} padding={3} radius={1} tabIndex={0}>
        {children}
      </Card>
    </ChangeIndicator>
  )
}

function DebugDiffField(props: {children?: React.ReactNode; path: Path}) {
  const {children, path} = props
  const [hovered, setHovered] = useState(false)

  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => setHovered(false), [])

  return (
    <ChangeFieldWrapper hasHover={hovered} path={path}>
      <Card borderLeft padding={3} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
      </Card>
    </ChangeFieldWrapper>
  )
}
