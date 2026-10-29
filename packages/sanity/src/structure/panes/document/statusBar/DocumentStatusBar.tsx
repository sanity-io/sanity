import {Card} from '@sanity/ui'
import {motion} from 'motion/react'
import {type Ref, useCallback, useMemo, useState} from 'react'
import {
  getCreatableVariantTarget,
  isPublishedPerspective,
  isReleaseDocument,
  usePerspective,
} from 'sanity'
import {Flex} from 'ui5'

import {usePaneRouter} from '../../../components/paneRouter/usePaneRouter'
import {SpacerButton} from '../../../components/spacerButton/SpacerButton'
import {EMPTY_PARAMS} from '../constants'
import {useDocumentPaneExtension} from '../documentPanel/DocumentPaneExtension'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentBadges} from './DocumentBadges'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './DocumentStatusBarActions'
import {DocumentStatusLine} from './DocumentStatusLine'
import {RevisionStatusLine} from './RevisionStatusLine'
import {useResizeObserver} from './useResizeObserver'

export interface DocumentStatusBarProps {
  actionsBoxRef?: Ref<HTMLDivElement>
}

const CONTAINER_BREAKPOINT = 480 // px

const AnimatedCard = motion.create(Card)

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {actionsBoxRef} = props
  const {documentId, documentType, editState, revisionNotFound, targetDocumentState} =
    useDocumentPane()
  // PROPOSED: a host control that stays in the bar when the status and actions are hidden (the extension's `footerLeadAlways`).
  const extension = useDocumentPaneExtension({documentId, documentType})
  const footerGreyed = Boolean(extension?.footerGreyed)
  const footerLeadAlone =
    extension?.footerLeadAlways && !footerGreyed ? extension.footerLead : undefined
  const {params = EMPTY_PARAMS} = usePaneRouter()
  const {selectedPerspective, selectedVariantName} = usePerspective()

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
      {!shouldRender && !showingRevision && footerGreyed && editState?.ready ? (
        // PROPOSED: no version to show, so no status line; the host's control and the actions keep their places, the actions greyed.
        <Flex
          alignItems="stretch"
          gap={1}
          justifyContent="flex-end"
          paddingLeft={1}
          paddingRight={1}
        >
          <Flex alignItems="flex-start" justifyContent="flex-end" style={{flexShrink: 0}}>
            <SpacerButton />
            <DocumentStatusBarActions disabled />
          </Flex>
        </Flex>
      ) : null}
      {!shouldRender && !showingRevision && footerLeadAlone && editState?.ready ? (
        // PROPOSED: no version to show, so no status and no Publish; the host's control keeps its place at the bar's right end.
        <Flex justifyContent="flex-end" paddingLeft={1} paddingRight={1}>
          {footerLeadAlone}
        </Flex>
      ) : null}
    </AnimatedCard>
  )
}
