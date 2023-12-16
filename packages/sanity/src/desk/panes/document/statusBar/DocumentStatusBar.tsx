import React, {useCallback, useState} from 'react'
import {Flex} from '@sanity/ui'
import {SpacerButton} from '../../../../ui/spacerButton'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './DocumentStatusBarActions'
import {useResizeObserver} from './useResizeObserver'
import {DocumentBadges} from './DocumentBadges'
import {DocumentStatusLine} from './DocumentStatusLine'
import {useTimelineSelector} from 'sanity'

export interface DocumentStatusBarProps {
  actionsBoxRef?: React.Ref<HTMLDivElement>
}

const CONTAINER_BREAKPOINT = 480 // px

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {actionsBoxRef} = props
  const {editState, timelineStore} = useDocumentPane()

  // Subscribe to external timeline state changes
  const showingRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)

  const [collapsed, setCollapsed] = useState<boolean | null>(null)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

  const handleResize = useCallback((event: ResizeObserverEntry) => {
    setCollapsed(event.contentRect.width < CONTAINER_BREAKPOINT)
  }, [])

  useResizeObserver({element: rootElement, onResize: handleResize})

  const shouldRender = editState?.ready && typeof collapsed === 'boolean'

  return (
    <Flex direction="column" ref={setRootElement} sizing="border">
      {shouldRender && (
        <Flex align="stretch" gap={1} justify="space-between">
          <Flex
            align="center"
            flex={1}
            gap={collapsed ? 2 : 3}
            paddingX={3}
            paddingY={2}
            wrap="wrap"
          >
            <Flex align="center">
              <DocumentStatusLine singleLine={!collapsed} />
              <SpacerButton size="large" />
            </Flex>
            <DocumentBadges />
          </Flex>

          <Flex
            align="flex-start"
            justify="flex-end"
            paddingY={2}
            ref={actionsBoxRef}
            style={{flexShrink: 0, marginLeft: 'auto'}}
          >
            <SpacerButton size="large" />
            {showingRevision ? <HistoryStatusBarActions /> : <DocumentStatusBarActions />}
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
