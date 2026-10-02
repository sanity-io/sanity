import {Card} from '@sanity/ui'
import {motion} from 'motion/react'
import {type Ref, useCallback, useMemo, useState} from 'react'
import {
  getCreatableVariantTarget,
  getDefaultVariant,
  isPublishedPerspective,
  isReleaseDocument,
  usePerspective,
} from 'sanity'
import {Flex} from 'ui5'

import {usePaneRouter} from '../../../components/paneRouter/usePaneRouter'
import {SpacerButton} from '../../../components/spacerButton/SpacerButton'
import {EMPTY_PARAMS} from '../constants'
import {
  DocumentToolbarSlotContent,
  type DocumentToolbarSlots,
} from '../document-layout/documentToolbarSlots'
import {useDocumentPane} from '../useDocumentPane'
import {type DocumentActionsPlacement} from './documentActionsPlacement'
import {DocumentBadges} from './DocumentBadges'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './DocumentStatusBarActions'
import {DocumentStatusLine} from './DocumentStatusLine'
import {RevisionStatusLine} from './RevisionStatusLine'
import {useResizeObserver} from './useResizeObserver'

export interface DocumentStatusBarProps {
  actionsBoxRef?: Ref<HTMLDivElement>
  placement?: DocumentActionsPlacement
  slots?: DocumentToolbarSlots
}

const CONTAINER_BREAKPOINT = 480 // px

const AnimatedCard = motion.create(Card)

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {actionsBoxRef, placement = 'bottom', slots} = props
  const atTop = placement === 'top'
  const {editState, revisionNotFound, targetDocumentState} = useDocumentPane()
  const {params = EMPTY_PARAMS} = usePaneRouter()
  const {selectedPerspective, selectedVariantNames} = usePerspective()
  const selectedVariantName = getDefaultVariant(selectedVariantNames)

  const showingRevision = Boolean(params.rev)
  const [collapsed, setCollapsed] = useState<boolean | null>(null)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

  const handleResize = useCallback((event: ResizeObserverEntry) => {
    setCollapsed(event.contentRect.width < CONTAINER_BREAKPOINT)
  }, [])

  useResizeObserver({element: rootElement, onResize: handleResize})

  const shouldRender = useMemo(() => {
    const isReady = Boolean(editState?.ready && typeof collapsed === 'boolean')

    // Hide the footer (status + actions) when a variant is requested but its target document has
    // not resolved to an editable version (missing, invalid selection, or mid-transition).
    // Mirrors the not-in-variant banner and read-only form state. Exception: a creatable missing
    // draft variant is editable (typing creates it), so the footer renders like the base
    // published-with-no-draft experience.
    if (
      selectedVariantName &&
      targetDocumentState.status !== 'ready' &&
      !getCreatableVariantTarget(targetDocumentState)
    ) {
      return false
    }

    // Prefer `targetDocument` so published / release variants (which are not always present on
    // `editState.published`) still render the footer.
    const hasTargetDocument =
      targetDocumentState.status === 'ready' && Boolean(targetDocumentState.targetDocument)
    if (hasTargetDocument) {
      return isReady
    }

    if (selectedPerspective) {
      if (isPublishedPerspective(selectedPerspective)) {
        return isReady && Boolean(editState?.published)
      }
      if (isReleaseDocument(selectedPerspective)) {
        return isReady && Boolean(editState?.version)
      }
    }

    return isReady
  }, [collapsed, editState, selectedPerspective, selectedVariantName, targetDocumentState])

  let actions: React.JSX.Element | null = null
  if (showingRevision) {
    actions = <HistoryStatusBarActions />
  } else {
    actions = <DocumentStatusBarActions />
  }

  if (showingRevision && revisionNotFound) {
    return null
  }

  return (
    <AnimatedCard
      key={showingRevision ? 'revision' : 'published'}
      initial={{opacity: 0.2}}
      animate={{opacity: 1, transition: {duration: 0.3}}}
      tone={showingRevision ? 'caution' : undefined}
      radius={atTop ? 0 : 3}
      borderBottom={atTop}
      ref={setRootElement}
      sizing="border"
      padding={2}
    >
      {shouldRender && (
        <Flex
          alignItems="stretch"
          gap={1}
          justifyContent="space-between"
          paddingLeft={showingRevision ? 0 : 1}
          paddingRight={showingRevision ? 0 : 1}
        >
          <Flex
            alignItems="center"
            flexBasis="0%"
            flexGrow={1}
            gap={collapsed ? 2 : 3}
            flexWrap="wrap"
            paddingRight={3}
          >
            <Flex alignItems="center">
              <DocumentToolbarSlotContent slot={slots?.documentStatus}>
                {showingRevision ? <RevisionStatusLine /> : <DocumentStatusLine />}
              </DocumentToolbarSlotContent>
              <SpacerButton />
            </Flex>
            <DocumentToolbarSlotContent slot={slots?.documentBadges}>
              <DocumentBadges />
            </DocumentToolbarSlotContent>
          </Flex>

          <Flex
            alignItems="flex-start"
            justifyContent="flex-end"
            ref={actionsBoxRef}
            style={{flexShrink: 0, marginLeft: 'auto'}}
          >
            <SpacerButton />
            <DocumentToolbarSlotContent slot={slots?.documentActions}>
              {actions}
            </DocumentToolbarSlotContent>
          </Flex>
        </Flex>
      )}
    </AnimatedCard>
  )
}
