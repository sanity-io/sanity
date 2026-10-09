import {Card} from '@sanity/ui'
import {motion} from 'motion/react'
import {type Ref, useCallback, useMemo, useState} from 'react'
import {getDefaultVariant, usePerspective} from 'sanity'
import {Flex} from 'ui5'

import {usePaneRouter} from '../../../components/paneRouter/usePaneRouter'
import {SpacerButton} from '../../../components/spacerButton/SpacerButton'
import {EMPTY_PARAMS} from '../constants'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentBadges} from './DocumentBadges'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './DocumentStatusBarActions'
import {DocumentStatusLine} from './DocumentStatusLine'
import {RevisionStatusLine} from './RevisionStatusLine'
import {shouldRenderDocumentStatusBar} from './shouldRenderDocumentStatusBar'
import {useResizeObserver} from './useResizeObserver'

export interface DocumentStatusBarProps {
  actionsBoxRef?: Ref<HTMLDivElement>
}

const CONTAINER_BREAKPOINT = 480 // px

const AnimatedCard = motion.create(Card)

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {actionsBoxRef} = props
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

  const shouldRenderForDocument = useMemo(
    () =>
      shouldRenderDocumentStatusBar({
        editState,
        targetDocumentState,
        selectedPerspective,
        selectedVariantName,
        showingRevision,
        revisionNotFound,
      }),
    [
      editState,
      revisionNotFound,
      selectedPerspective,
      selectedVariantName,
      showingRevision,
      targetDocumentState,
    ],
  )
  // `collapsed` is only known once the root element has been measured; wait for it so the
  // first paint already uses the right spacing.
  const shouldRender = shouldRenderForDocument && typeof collapsed === 'boolean'

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
      radius={3}
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
              {showingRevision ? <RevisionStatusLine /> : <DocumentStatusLine />}
              <SpacerButton />
            </Flex>
            <DocumentBadges />
          </Flex>

          <Flex
            alignItems="flex-start"
            justifyContent="flex-end"
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
