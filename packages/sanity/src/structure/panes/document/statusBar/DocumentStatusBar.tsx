import {Card, Flex} from '@sanity/ui'
import {motion} from 'framer-motion'
import {type Ref, useCallback, useMemo, useState} from 'react'
import {
  type CreateLinkMetadata,
  isPublishedPerspective,
  isReleaseDocument,
  isSanityCreateLinked,
  usePerspective,
  useSanityCreateConfig,
} from 'sanity'

import {SpacerButton} from '../../../components/spacerButton'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../constants'
import {useDocumentPane} from '../useDocumentPane'
import {useDocumentTitle} from '../useDocumentTitle'
import {DocumentBadges} from './DocumentBadges'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './DocumentStatusBarActions'
import {DocumentStatusLine} from './DocumentStatusLine'
import {RevisionStatusLine} from './RevisionStatusLine'
import {useResizeObserver} from './useResizeObserver'

export interface DocumentStatusBarProps {
  actionsBoxRef?: Ref<HTMLDivElement>
  createLinkMetadata?: CreateLinkMetadata
}

const CONTAINER_BREAKPOINT = 480 // px

const AnimatedCard = motion.create(Card)

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {actionsBoxRef, createLinkMetadata} = props
  const {editState, revisionId, onChange: onDocumentChange} = useDocumentPane()
  const {selectedPerspective} = usePerspective()
  const {title} = useDocumentTitle()

  const CreateLinkedActions = useSanityCreateConfig().components?.documentLinkedActions

  const showingRevision = Boolean(revisionId)
  const [collapsed, setCollapsed] = useState<boolean | null>(null)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

  const handleResize = useCallback((event: ResizeObserverEntry) => {
    setCollapsed(event.contentRect.width < CONTAINER_BREAKPOINT)
  }, [])

  useResizeObserver({element: rootElement, onResize: handleResize})

  const shouldRender = useMemo(() => {
    const isReady = Boolean(editState?.ready && typeof collapsed === 'boolean')
    if (selectedPerspective) {
      if (isPublishedPerspective(selectedPerspective)) {
        return isReady && Boolean(editState?.published)
      }
      if (isReleaseDocument(selectedPerspective)) {
        return isReady && Boolean(editState?.version)
      }
    }
    return isReady
  }, [collapsed, editState?.published, editState?.ready, editState?.version, selectedPerspective])

  let actions: React.JSX.Element | null = null
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
    <AnimatedCard
      key={showingRevision ? 'revision' : 'published'}
      initial={{opacity: 0.2}}
      animate={{opacity: 1, transition: {duration: 0.3}}}
      tone={showingRevision ? 'caution' : undefined}
      radius={3}
      ref={setRootElement}
      sizing="border"
      padding={2}
    >
      {shouldRender && (
        <Flex
          align="stretch"
          gap={1}
          justify="space-between"
          paddingLeft={showingRevision ? 0 : 1}
          paddingRight={showingRevision ? 0 : 1}
        >
          <Flex align="center" flex={1} gap={collapsed ? 2 : 3} wrap="wrap" paddingRight={3}>
            <Flex align="center">
              {showingRevision ? <RevisionStatusLine /> : <DocumentStatusLine />}
              <SpacerButton />
            </Flex>
            <DocumentBadges />
          </Flex>

          <Flex
            align="flex-start"
            justify="flex-end"
            ref={actionsBoxRef}
            style={{flexShrink: 0, marginLeft: 'auto'}}
          >
            <SpacerButton />
            {actions}
          </Flex>
        </Flex>
      )}
    </AnimatedCard>
  )
}
