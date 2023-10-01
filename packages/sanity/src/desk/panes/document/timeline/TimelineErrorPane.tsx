import {RetryIcon} from '@sanity/icons'
import {Button, Flex, Stack} from '@sanity/ui'
import React from 'react'
import {Pane, PaneContent} from '../../../components'
import {TextWithTone} from 'sanity'

interface TimelineErrorPaneProps {
  paneKey: string
  flex?: number
  minWidth?: number
  onRetry: () => void
}

export function TimelineErrorPane({paneKey, flex, minWidth, onRetry}: TimelineErrorPaneProps) {
  return (
    <Pane id={paneKey} flex={flex} minWidth={minWidth}>
      <PaneContent>
        <Flex align="center" direction="column" height="fill" justify="center">
          <Stack space={3}>
            <TextWithTone size={1} tone="default" weight="semibold">
              An error occurred whilst retrieving document changes.
            </TextWithTone>
            <TextWithTone size={1} tone="default">
              Document history transactions have not been affected.
            </TextWithTone>
            <Button text="Retry" icon={RetryIcon} onClick={onRetry} mode="ghost" />
          </Stack>
        </Flex>
      </PaneContent>
    </Pane>
  )
}
