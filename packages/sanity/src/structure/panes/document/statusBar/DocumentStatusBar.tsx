import {Flex} from '@sanity/ui'
import {type Ref, useCallback, useState} from 'react'
import {
  type CreateLinkMetadata,
  isSanityCreateLinked,
  useSanityCreateConfig,
  useTimelineSelector,
} from 'sanity'

import {SpacerButton} from '../../../components/spacerButton'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../constants'
import {useDocumentPane} from '../useDocumentPane'
import {useDocumentTitle} from '../useDocumentTitle'
import {DocumentBadges} from './DocumentBadges'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './DocumentStatusBarActions'
import {DocumentStatusLine} from './DocumentStatusLine'
import {useResizeObserver} from './useResizeObserver'

export interface DocumentStatusBarProps {
  actionsBoxRef?: Ref<HTMLDivElement>
  createLinkMetadata?: CreateLinkMetadata
}

const CONTAINER_BREAKPOINT = 480 // px

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {actionsBoxRef, createLinkMetadata} = props
  const {editState, timelineStore, onChange: onDocumentChange} = useDocumentPane()
  const {title} = useDocumentTitle()

  const CreateLinkedActions = useSanityCreateConfig().components?.documentLinkedActions

  // Subscribe to external timeline state changes
  const showingRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)

  const [collapsed, setCollapsed] = useState<boolean | null>(null)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

  const handleResize = useCallback((event: ResizeObserverEntry) => {
    setCollapsed(event.contentRect.width < CONTAINER_BREAKPOINT)
  }, [])

  useResizeObserver({element: rootElement, onResize: handleResize})

  const shouldRender = editState?.ready && typeof collapsed === 'boolean'

  let actions: JSX.Element | null = null
  if (createLinkMetadata && isSanityCreateLinked(createLinkMetadata) && CreateLinkedActions) {
    actions = (
      <CreateLinkedActions
        metadata={createLinkMetadata}
        panelPortalElementId={DOCUMENT_PANEL_PORTAL_ELEMENT}
        onDocumentChange={onDocumentChange}
        documentTitle={title}
      />
    )
  } else if (showingRevision) {
    actions = <HistoryStatusBarActions />
  } else {
    actions = <DocumentStatusBarActions />
  }

  return (
    <Flex direction="column" ref={setRootElement} sizing="border">
      {shouldRender && (
        <Flex
          align="stretch"
          gap={1}
          justify="space-between"
          paddingY={2}
          paddingLeft={4}
          paddingRight={3}
        >
          <Flex align="center" flex={1} gap={collapsed ? 2 : 3} wrap="wrap" paddingRight={3}>
            <Flex align="center">
              <DocumentStatusLine singleLine={!collapsed} />
              <SpacerButton size="large" />
            </Flex>
            <DocumentBadges />
          </Flex>

          <Flex
            align="flex-start"
            justify="flex-end"
            ref={actionsBoxRef}
            style={{flexShrink: 0, marginLeft: 'auto'}}
          >
            <SpacerButton size="large" />
            {actions}
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
