import {type ReleaseDocument} from '@sanity/client'
import {ComposeSparklesIcon} from '@sanity/icons/ComposeSparkles'
import {LockIcon} from '@sanity/icons/Lock'
import {UnlockIcon} from '@sanity/icons/Unlock'
import {type BadgeTone} from '@sanity/ui'
import {memo, type ReactNode, useEffect, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useCanvasCompanionDocsStore} from '../../../canvas/store/useCanvasCompanionDocsStore'
import {useReleasesToolAvailable} from '../../../schedules/hooks/useReleasesToolAvailable'
import {getDraftId, getPublishedId, getVersionId} from '../../../util/draftUtils'
import {isPausedCardinalityOneRelease} from '../../../util/releaseUtils'
import {useVersionContextMenu} from '../../hooks/useVersionContextMenu'
import {Chip} from '../Chip'
import {ReleaseAvatarIcon} from '../ReleaseAvatar'
import {VersionContextMenuDialogs} from './contextMenu/VersionContextMenuDialogs'
import {VersionContextMenuPopover} from './contextMenu/VersionContextMenuPopover'

const useVersionIsLinked = (documentId: string, fromRelease: string) => {
  const versionId = useMemo(() => {
    if (fromRelease === 'published') return getPublishedId(documentId)
    if (fromRelease === 'draft') return getDraftId(documentId)
    return getVersionId(documentId, fromRelease)
  }, [documentId, fromRelease])

  const companionDocsStore = useCanvasCompanionDocsStore()
  const companionDocs$ = useMemo(
    () => companionDocsStore.getCompanionDocs(documentId),
    [documentId, companionDocsStore],
  )
  // Deferred (per review): navigating to another document remounts the
  // document pane (its `_key` changes), resetting this state, so a deferred
  // read can't report linkage for a previous document. react-rx v5's
  // identity-coherent deferral also falls back to the live value if the
  // observable identity changes without a remount.
  const companionDocs = useObservable(companionDocs$)
  return companionDocs?.data.some((companion) => companion?.studioDocumentId === versionId)
}

/**
 * @internal
 */
export const VersionChip = memo(function VersionChip(props: {
  disabled?: boolean
  selected: boolean
  tooltipContent?: ReactNode
  onClick: () => void
  text: string
  // if the VersionChip itself is contained in a portal (e.g., as in the NonReleaseVersionSelect)
  // there is no need to also make the context menu a portal (and it also breaks useClickOutside)
  contextMenuPortal?: boolean
  tone: BadgeTone
  locked?: boolean
  onCopyToDraftsComplete?: () => void
  contextValues: {
    documentGroupId: string
    versionId: string
    documentType: string
    releases: ReleaseDocument[]
    releasesLoading: boolean
    bundleId: string
    isVersion: boolean
    disabled?: boolean
    isGoingToUnpublish?: boolean
    release?: ReleaseDocument
  }
}) {
  const {
    disabled,
    selected,
    tooltipContent,
    onClick,
    text,
    contextMenuPortal = true,
    tone,
    locked = false,
    onCopyToDraftsComplete,
    contextValues: {
      documentGroupId,
      versionId,
      releases,
      releasesLoading,
      documentType,
      bundleId,
      isVersion,
      disabled: contextMenuDisabled = false,
      isGoingToUnpublish = false,
      release,
    },
  } = props
  const releasesToolAvailable = useReleasesToolAvailable()
  const isLinked = useVersionIsLinked(documentGroupId, bundleId)
  const chipRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (selected) chipRef.current?.scrollIntoView({inline: 'center'})
  }, [selected])

  const {
    contextMenu,
    handleContextMenu,
    popoverRef,
    referenceElement,
    setReferenceElement,
    dialogState,
    closeDialog,
    openDiscardDialog,
    openCreateReleaseDialog,
    handleCopyToDrafts,
    handleAddVersion,
    isScheduledDraft,
    scheduledDraftMenuActions,
    sourceReleasePerspective,
  } = useVersionContextMenu({
    documentGroupId,
    versionId,
    documentType,
    disabled: contextMenuDisabled,
    onCopyToDraftsComplete,
  })

  const contextMenuHandler = disabled || !releasesToolAvailable ? undefined : handleContextMenu

  const isPaused = isPausedCardinalityOneRelease(release)

  const rightIcon = useMemo(() => {
    if (isLinked) return <ComposeSparklesIcon />
    if (isPaused) return <UnlockIcon />
    if (locked) return <LockIcon />
    return undefined
  }, [isLinked, isPaused, locked])

  return (
    <>
      <Tooltip content={tooltipContent} fallbackPlacements={[]} portal placement="bottom">
        {/* This span is needed to make the tooltip work in disabled buttons */}
        <span ref={chipRef}>
          <Chip
            data-testid={`document-header-${text.replaceAll(' ', '-')}-chip`}
            ref={setReferenceElement}
            disabled={disabled}
            mode={disabled ? 'ghost' : 'bleed'}
            onClick={onClick}
            selected={selected}
            tone={tone}
            onContextMenu={contextMenuHandler}
            icon={<ReleaseAvatarIcon release={sourceReleasePerspective} />}
            iconRight={rightIcon}
            text={text}
          />
        </span>
      </Tooltip>

      <VersionContextMenuPopover
        contextMenu={contextMenu}
        popoverRef={popoverRef}
        referenceElement={referenceElement}
        documentGroupId={documentGroupId}
        versionId={versionId}
        documentType={documentType}
        bundleId={bundleId}
        releases={releases}
        releasesLoading={releasesLoading}
        onDiscard={openDiscardDialog}
        onCreateRelease={openCreateReleaseDialog}
        onCopyToDrafts={handleCopyToDrafts}
        onCreateVersion={handleAddVersion}
        disabled={contextMenuDisabled}
        locked={locked}
        isGoingToUnpublish={isGoingToUnpublish}
        release={release}
        isScheduledDraft={isScheduledDraft}
        scheduledDraftMenuActions={scheduledDraftMenuActions}
        portal={contextMenuPortal}
      />

      <VersionContextMenuDialogs
        dialogState={dialogState}
        onClose={closeDialog}
        versionId={versionId}
        documentType={documentType}
        title={text}
        sourceReleasePerspective={sourceReleasePerspective}
        onCreateVersion={handleAddVersion}
        onCopyToDrafts={handleCopyToDrafts}
        isGoingToUnpublish={isGoingToUnpublish}
        scheduledDraftDialogs={isScheduledDraft && scheduledDraftMenuActions.dialogs}
        isDiscardable={true}
      />
    </>
  )
})
