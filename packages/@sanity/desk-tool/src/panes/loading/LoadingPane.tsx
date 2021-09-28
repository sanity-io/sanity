import {Box, CardTone, Flex, Spinner, Text, _raf2} from '@sanity/ui'
import React, {useMemo, useState, useEffect} from 'react'
import {Observable} from 'rxjs'
import styled from 'styled-components'
import {Delay} from '../../components/Delay'
import {Pane, PaneContent} from '../../components/pane'

interface LoadingPaneProps {
  // @todo Re-implement delay for Spinner
  // eslint-disable-next-line react/no-unused-prop-types
  delay?: number
  flex?: number
  index?: number
  isSelected?: boolean
  message?: string | ((p: string[]) => string | Observable<string>)
  minWidth?: number
  path?: string[]
  title?: string
  tone?: CardTone
}

const DELAY = false
const DEFAULT_MESSAGE = 'Loading…'

const Content = styled(Flex)`
  opacity: 0;
  transition: opacity 200ms;

  &[data-mounted] {
    opacity: 1;
  }
`

/**
 * @internal
 */
export function LoadingPane(props: LoadingPaneProps) {
  const {
    delay = 300,
    flex,
    index,
    isSelected,
    message: messageProp,
    minWidth,
    path = [],
    title,
    tone,
  } = props

  const resolvedMessage = useMemo(() => {
    if (typeof messageProp === 'function') {
      return messageProp(path)
    }

    return messageProp
  }, [messageProp, path])

  const [currentMessage, setCurrentMessage] = useState<string | null>(() => {
    if (typeof resolvedMessage === 'string') return resolvedMessage
    return DEFAULT_MESSAGE
  })

  useEffect(() => {
    if (typeof resolvedMessage !== 'object') return undefined
    if (typeof resolvedMessage.subscribe === 'function') return undefined

    const sub = resolvedMessage.subscribe(setCurrentMessage)

    return () => sub.unsubscribe()
  }, [resolvedMessage])

  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!contentElement) return undefined
    return _raf2(() => setMounted(true))
  }, [contentElement])

  const content = (
    <Content
      align="center"
      data-mounted={mounted ? '' : undefined}
      direction="column"
      height="fill"
      justify="center"
      ref={setContentElement}
    >
      <Spinner muted />

      {(title || currentMessage) && (
        <Box marginTop={3}>
          <Text align="center" muted size={1}>
            {title || currentMessage}
          </Text>
        </Box>
      )}
    </Content>
  )

  return (
    <Pane data-index={index} flex={flex} minWidth={minWidth} selected={isSelected} tone={tone}>
      <PaneContent>{DELAY ? <Delay ms={delay}>{content}</Delay> : content}</PaneContent>
    </Pane>
  )
}
