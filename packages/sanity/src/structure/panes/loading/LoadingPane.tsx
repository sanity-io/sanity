import {_raf2, type CardTone} from '@sanity/ui'
import {memo, useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {isObservable, type Observable, of} from 'rxjs'
import {map} from 'rxjs/operators'
import {Delay, LoadingBlock, useTranslation} from 'sanity'
import {Flex} from 'ui5'

import {Pane} from '../../components/pane/Pane'
import {PaneContent} from '../../components/pane/PaneContent'
import {structureLocaleNamespace} from '../../i18n'
import {getWaitMessages, type WaitMessage} from './getWaitMessages'
import {content as contentClassName} from './LoadingPane.css'

interface LoadingPaneProps {
  delay?: number
  flex?: number
  message?: string | ((p: string[]) => string | Observable<WaitMessage>)
  minWidth?: number
  paneKey: string
  path?: string
  selected?: boolean
  title?: string
  tone?: CardTone
}

const DELAY = false
const DEFAULT_MESSAGE_KEY = 'panes.resolving.default-message'

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

  const {t} = useTranslation(structureLocaleNamespace)

  const resolvedMessage = useMemo(() => {
    if (typeof messageProp === 'function') {
      return messageProp(path ? path.split(';') : [])
    }

    return messageProp
  }, [messageProp, path])

  const defaultMessage =
    typeof resolvedMessage === 'string' ? resolvedMessage : t(DEFAULT_MESSAGE_KEY)

  const message$ = useMemo(() => {
    if (typeof resolvedMessage === 'string') {
      return of(resolvedMessage)
    }

    // Require a real RxJS Observable (`pipe`), not a bare Subscribable.
    if (!isObservable(resolvedMessage)) {
      return of(defaultMessage)
    }

    return resolvedMessage.pipe(
      map((message) => ('messageKey' in message ? t(message.messageKey) : message.message)),
    )
  }, [resolvedMessage, t, defaultMessage])

  const currentMessage = useObservable(message$, defaultMessage)

  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!contentElement) return undefined
    return _raf2(() => setMounted(true))
  }, [contentElement])

  const content = (
    <Flex
      alignItems="center"
      className={contentClassName}
      data-mounted={mounted ? '' : undefined}
      flexDirection="column"
      height="100%"
      justifyContent="center"
      ref={setContentElement}
    >
      <LoadingBlock showText title={title || currentMessage} />
    </Flex>
  )

  return (
    <Pane flex={flex} id={paneKey} minWidth={minWidth} selected={selected} tone={tone}>
      <PaneContent>{DELAY ? <Delay ms={delay}>{content}</Delay> : content}</PaneContent>
    </Pane>
  )
})
