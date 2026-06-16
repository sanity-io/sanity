import {type ReleaseDocument} from '@sanity/client'
import {ComposeSparklesIcon, LockIcon, UnlockIcon} from '@sanity/icons'
import {type BadgeTone} from '@sanity/ui'
import {memo, type ReactNode, useEffect, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'

import {Tooltip} from '../../../../ui-components'
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
  onCopyToDraftsNavigate: () => void
  contextValues: {
    documentId: string
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
    onCopyToDraftsNavigate,
    contextValues: {
      documentId,
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
  const isLinked = useVersionIsLinked(documentId, bundleId)

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
    openCopyToDraftsDialog,
    handleAddVersion,
    isScheduledDraft,
    scheduledDraftMenuActions,
    sourceReleasePerspective,
  } = useVersionContextMenu({
    documentId,
    documentType,
    bundleId,
    isVersion,
    disabled: contextMenuDisabled,
    release,
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
        documentId={documentId}
        documentType={documentType}
        bundleId={bundleId}
        isVersion={isVersion}
        releases={releases}
        releasesLoading={releasesLoading}
        onDiscard={openDiscardDialog}
        onCreateRelease={openCreateReleaseDialog}
        onCopyToDrafts={openCopyToDraftsDialog}
        onCopyToDraftsNavigate={onCopyToDraftsNavigate}
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
        documentId={documentId}
        documentType={documentType}
        bundleId={bundleId}
        isVersion={isVersion}
        title={text}
        sourceReleasePerspective={sourceReleasePerspective}
        onCreateVersion={handleAddVersion}
        onCopyToDraftsNavigate={onCopyToDraftsNavigate}
        isGoingToUnpublish={isGoingToUnpublish}
        scheduledDraftDialogs={isScheduledDraft && scheduledDraftMenuActions.dialogs}
      />
    </>
  )
})
