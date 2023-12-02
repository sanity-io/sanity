import {CardTone, Flex, _raf2} from '@sanity/ui'
import React, {memo, useMemo, useState, useEffect} from 'react'
import {Observable} from 'rxjs'
import styled from 'styled-components'
import {LoadingBlock} from '../../../ui/loadingBlock'
import {Delay} from '../../components/Delay'
import {Pane, PaneContent} from '../../components/pane'
import {getWaitMessages} from './getWaitMessages'

interface LoadingPaneProps {
  delay?: number
  flex?: number
  message?: string | ((p: string[]) => string | Observable<string>)
  minWidth?: number
  paneKey: string
  path?: string
  selected?: boolean
  title?: string
  tone?: CardTone
}

const DELAY = false
const DEFAULT_MESSAGE = 'Loading'

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
export const LoadingPane = memo((props: LoadingPaneProps) => {
  const {
    delay = 300,
    flex,
    message: messageProp = getWaitMessages,
    minWidth,
    paneKey,
    path,
    selected,
    title,
    tone,
  } = props

  const resolvedMessage = useMemo(() => {
    if (typeof messageProp === 'function') {
      return messageProp(path ? path.split(';') : [])
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
      <LoadingBlock title={title || currentMessage} />
    </Content>
  )

  return (
    <Pane flex={flex} id={paneKey} minWidth={minWidth} selected={selected} tone={tone}>
      <PaneContent>{DELAY ? <Delay ms={delay}>{content}</Delay> : content}</PaneContent>
    </Pane>
  )
})

LoadingPane.displayName = 'LoadingPane'
