import {Flex, LayerProvider, Stack, Text} from '@sanity/ui'
import {memo, useMemo, useState} from 'react'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  DocumentGroupInventory,
  DocumentGroupInventoryAction,
  type DocumentGroupInventoryProps,
  Hotkeys,
  isSanityDefinedAction,
  useClient,
  useDocumentStore,
  usePausedScheduledDraft,
  usePerspective,
  useSetVariant,
  useSource,
} from 'sanity'

import {Button, Tooltip} from '../../../../ui-components'
import {RenderActionCollectionState, type ResolvedAction, usePaneRouter} from '../../../components'
import {ReferencePreviewLink} from '../../../components/confirmDeleteDialog/ReferencePreviewLink'
import {referringDocuments} from '../../../components/confirmDeleteDialog/useReferringDocuments'
import {VersionsPreviewList} from '../../../components/confirmDeleteDialog/VersionsPreviewList'
import {DocTitle} from '../../../components/DocTitle'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../constants'
import {useHistoryRestoreAction} from '../../../documentActions'
import {useDocumentPerspectiveList} from '../../../hooks/useDocumentPerspectiveList'
import {useIsEditingVariantDocument} from '../../../hooks/useIsEditingVariantDocument'
import {usePerspectiveNavigator} from '../../../hooks/usePerspectiveNavigator'
import {toLowerCaseNoSpaces} from '../../../util/toLowerCaseNoSpaces'
import {useDocumentPane} from '../useDocumentPane'
import {ActionMenuButton} from './ActionMenuButton'
import {ActionStateDialog} from './ActionStateDialog'

const documentGroupInventoryComponents: DocumentGroupInventoryProps['components'] = {
  DocTitle,
  ReferencePreviewLink,
  VersionsPreviewList,
}

interface DocumentStatusBarActionsInnerProps {
  disabled: boolean
  states: ResolvedAction[]
}

const DocumentStatusBarActionsInner = memo(function DocumentStatusBarActionsInner(
  props: DocumentStatusBarActionsInnerProps,
) {
  const {disabled, states} = props
  const {__internal_tasks, beta} = useSource()

  const {
    displayed,
    editState,
    isDocumentGroupInventoryActive,
    setIsDocumentGroupInventoryActive,
    documentId,
    documentType,
  } = useDocumentPane()
  const {params} = usePaneRouter()

  const showingRevision = Boolean(params?.rev)

  const perspectiveList = useDocumentPerspectiveList()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const documentStore = useDocumentStore()
  const referringDocuments$ = useMemo(
    () => referringDocuments({documentId, versionedClient: client, documentStore}),
    [documentId, client, documentStore],
  )

  const {selectedReleaseId} = usePerspective()
  const [firstActionState, ...menuActionStates] = states
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const {isPaused} = usePausedScheduledDraft()
  const hasDocumentGroupInventory = beta?.documentGroupInventory?.enabled === true

  // TODO: This could be refactored to use the tooltip from the button if the firstAction.title was updated to a string.
  const tooltipContent = useMemo(() => {
    if (!firstActionState || (!firstActionState.title && !firstActionState.shortcut)) return null

    return (
      <Flex style={{maxWidth: 300}} align="center" gap={3}>
        {firstActionState.title && <Text size={1}>{firstActionState.title}</Text>}
        {firstActionState.shortcut && (
          <Hotkeys
            data-testid="document-status-bar-hotkeys"
            fontSize={1}
            style={{marginTop: -4, marginBottom: -4}}
            keys={String(firstActionState.shortcut)
              .split('+')
              .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase())}
          />
        )}
      </Flex>
    )
  }, [firstActionState])

  const shouldShowScheduleAsFirstActionButton = firstActionState?.action === 'schedule' && isPaused

  const showFirstActionButton = showingRevision
    ? Boolean(firstActionState)
    : selectedReleaseId
      ? // For paused drafts, only allow 'schedule' action as primary
        // Otherwise, only show custom (non-Sanity-defined) actions as primary
        firstActionState &&
        (shouldShowScheduleAsFirstActionButton || !isSanityDefinedAction(firstActionState))
      : firstActionState && (!editState?.liveEdit || editState?.version)

  const sideMenuItems = useMemo(() => {
    return showFirstActionButton
      ? menuActionStates
      : [firstActionState, ...menuActionStates].filter(Boolean)
  }, [showFirstActionButton, firstActionState, menuActionStates])

  return (
    <Flex align="center" gap={3}>
      {__internal_tasks && __internal_tasks.footerAction}
      {hasDocumentGroupInventory && typeof displayed?._id !== 'undefined' && (
        <DocumentGroupInventoryAction
          documentId={displayed._id}
          portalElementName={DOCUMENT_PANEL_PORTAL_ELEMENT}
          isDocumentGroupInventoryActive={isDocumentGroupInventoryActive}
          setIsDocumentGroupInventoryActive={setIsDocumentGroupInventoryActive}
        >
          <DocumentGroupInventory
            documentId={displayed._id}
            documentType={documentType}
            portalElementName={DOCUMENT_PANEL_PORTAL_ELEMENT}
            perspectiveList={perspectiveList}
            referringDocuments$={referringDocuments$}
            components={documentGroupInventoryComponents}
          />
        </DocumentGroupInventoryAction>
      )}
      {showFirstActionButton && (
        <LayerProvider zOffset={200}>
          <Tooltip disabled={!tooltipContent} content={tooltipContent} placement="top">
            <Stack>
              <Button
                data-testid={`action-${toLowerCaseNoSpaces(firstActionState.label)}`}
                disabled={disabled || Boolean(firstActionState.disabled)}
                icon={firstActionState.icon}
                onClick={firstActionState.onHandle}
                ref={setButtonElement}
                text={firstActionState.label}
                tone={firstActionState.tone || 'primary'}
              />
            </Stack>
          </Tooltip>
        </LayerProvider>
      )}
      {sideMenuItems.length > 0 && (
        <ActionMenuButton actionStates={sideMenuItems} disabled={disabled} />
      )}
      {showFirstActionButton && firstActionState && firstActionState.dialog && (
        <ActionStateDialog dialog={firstActionState.dialog} referenceElement={buttonElement} />
      )}
    </Flex>
  )
})

export const DocumentStatusBarActions = memo(function DocumentStatusBarActions() {
  return (
    <RenderActionCollectionState group="default">
      {({states}) => <RenderDocumentStatusBarActions states={states} />}
    </RenderActionCollectionState>
  )
})

function RenderDocumentStatusBarActions(props: {states: ResolvedAction[]}) {
  const {connectionState, documentId} = useDocumentPane()

  const isEditingVariantDocument = useIsEditingVariantDocument()

  // The restore action has a dedicated place in the UI; it's only visible when the user is viewing
  // a different document revision. It must be omitted from this collection.
  const states = props.states.filter((state) =>
    state.action ? state.action !== useHistoryRestoreAction.action : true,
  )

  if (states.length === 0) return null

  return (
    <DocumentStatusBarActionsInner
      // Use document ID as key to make sure that the actions state is reset when the document changes
      key={documentId}
      disabled={connectionState !== 'connected'}
      // Temporary: hide actions when editing a variant document until actions are supported on variant documents
      // See PR https://github.com/sanity-io/sanity/pull/13156
      states={isEditingVariantDocument ? [] : states}
    />
  )
}

export const HistoryStatusBarActions = memo(function HistoryStatusBarActions() {
  return (
    <RenderActionCollectionState group="default">
      {({states}) => <RenderHistoryStatusBarActions states={states} />}
    </RenderActionCollectionState>
  )
})

function RenderHistoryStatusBarActions({states}: {states: ResolvedAction[]}) {
  const {connectionState, editState, revisionId: revision} = useDocumentPane()

  const disabled = (editState?.draft || editState?.published || {})._rev === revision

  return (
    <DocumentStatusBarActionsInner
      disabled={connectionState !== 'connected' || Boolean(disabled)}
      // If multiple `restore` actions are defined, ensure only the final one is used.
      states={states
        .filter((state) => (state.action ? state.action === useHistoryRestoreAction.action : false))
        .slice(-1)}
    />
  )
}
