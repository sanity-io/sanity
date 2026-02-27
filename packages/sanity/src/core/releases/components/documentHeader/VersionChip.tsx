import {type ReleaseDocument} from '@sanity/client'
import {ComposeSparklesIcon, LockIcon, UnlockIcon} from '@sanity/icons'
import {type BadgeTone, useClickOutsideEvent, useGlobalKeyDown, useToast} from '@sanity/ui'
import {
  memo,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {useObservable} from 'react-rx'

import {Popover, Tooltip} from '../../../../ui-components'
import {useCanvasCompanionDocsStore} from '../../../canvas/store/useCanvasCompanionDocsStore'
import {useTranslation} from '../../../i18n'
import {useReleasesToolAvailable} from '../../../schedules/hooks/useReleasesToolAvailable'
import {useSingleDocRelease} from '../../../singleDocRelease/context/SingleDocReleaseProvider'
import {useScheduledDraftMenuActions} from '../../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {getDraftId, getPublishedId, getVersionId} from '../../../util/draftUtils'
import {isCardinalityOneRelease, isPausedCardinalityOneRelease} from '../../../util/releaseUtils'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {LATEST, PUBLISHED} from '../../util/const'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {Chip} from '../Chip'
import {DiscardVersionDialog} from '../dialog/DiscardVersionDialog'
import {ReleaseAvatarIcon} from '../ReleaseAvatar'
import {VersionContextMenu} from './contextMenu/VersionContextMenu'
import {CopyToDraftsDialog} from './dialog/CopyToDraftsDialog'
import {CopyToNewReleaseDialog} from './dialog/CopyToNewReleaseDialog'

type VersionChipDialogState = 'idle' | 'discard-version' | 'create-release' | 'copy-to-drafts'

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

const CONTEXT_MENU_CLOSED = {open: false as const}

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

  const [contextMenu, setContextMenu] = useState<
    {open: true; translate: {x: number; y: number}} | {open: false}
  >({open: false})
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [dialogState, setDialogState] = useState<VersionChipDialogState>('idle')

  const chipRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (selected) chipRef.current?.scrollIntoView({inline: 'center'})
  }, [selected])

  const docId = isVersion ? getVersionId(documentId, bundleId) : documentId // operations recognises publish and draft as empty

  const {createVersion} = useVersionOperations()
  const toast = useToast()
  const {t} = useTranslation()
  const {onSetScheduledDraftPerspective} = useSingleDocRelease()

  const close = useCallback(() => setContextMenu(CONTEXT_MENU_CLOSED), [])
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)

  const handleContextMenu = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const elementRect = event.currentTarget?.getBoundingClientRect()
    setContextMenu({
      open: true,
      // note: this offsets the context menu popover position
      // and depends on placement=bottom-start
      translate: {x: event.clientX - elementRect.left, y: elementRect.top - event.clientY},
    })
  }, [])

  useClickOutsideEvent(close, () => [popoverRef.current])

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (event.key === 'Escape') {
          close()
        }
      },
      [close],
    ),
  )

  const openDiscardDialog = useCallback(() => {
    setDialogState('discard-version')
  }, [])

  const openCreateReleaseDialog = useCallback(() => {
    setDialogState('create-release')
  }, [])

  const openCopyToDraftsDialog = useCallback(() => {
    setDialogState('copy-to-drafts')
  }, [])

  const handleAddVersion = useCallback(
    async (targetRelease: string) => {
      try {
        await createVersion(getReleaseIdFromReleaseDocumentId(targetRelease), docId)
      } catch (err) {
        toast.push({
          closable: true,
          status: 'error',
          title: t('release.action.create-version.failure'),
          description: err.message,
        })
      }

      close()
    },
    [close, createVersion, docId, t, toast],
  )

  const contextMenuHandler = disabled || !releasesToolAvailable ? undefined : handleContextMenu

  const isScheduledDraft = release && isVersion && isCardinalityOneRelease(release)

  const handleEditScheduleComplete = useCallback(() => {
    if (!release) return
    onSetScheduledDraftPerspective(getReleaseIdFromReleaseDocumentId(release._id))
  }, [release, onSetScheduledDraftPerspective])

  const scheduledDraftMenuActions = useScheduledDraftMenuActions({
    release,
    documentType,
    documentId,
    disabled: contextMenuDisabled,
    onActionComplete: handleEditScheduleComplete,
  })

  const isPaused = isPausedCardinalityOneRelease(release)
  const sourceReleasePerspective =
    release ?? (bundleId === 'published' ? PUBLISHED : bundleId === 'draft' ? LATEST : bundleId)

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

      <Popover
        animate={false}
        content={
          <VersionContextMenu
            documentId={documentId}
            releases={releases}
            releasesLoading={releasesLoading}
            fromRelease={bundleId}
            isVersion={isVersion}
            onDiscard={openDiscardDialog}
            onCreateRelease={openCreateReleaseDialog}
            onCopyToDrafts={openCopyToDraftsDialog}
            onCopyToDraftsNavigate={onCopyToDraftsNavigate}
            disabled={contextMenuDisabled}
            onCreateVersion={handleAddVersion}
            locked={locked}
            type={documentType}
            isGoingToUnpublish={isGoingToUnpublish}
            release={release}
            isScheduledDraft={isScheduledDraft}
            scheduledDraftMenuActions={scheduledDraftMenuActions}
          />
        }
        fallbackPlacements={[]}
        open={contextMenu.open}
        portal={contextMenuPortal}
        placement="bottom-start"
        ref={popoverRef}
        referenceElement={referenceElement}
        zOffset={10}
        style={
          contextMenu.open
            ? {transform: `translate(${contextMenu.translate.x}px, ${contextMenu.translate.y}px)`}
            : undefined
        }
      />

      {dialogState === 'discard-version' && (
        <DiscardVersionDialog
          onClose={() => setDialogState('idle')}
          documentId={isVersion ? getVersionId(documentId, bundleId) : documentId}
          fromPerspective={text}
          documentType={documentType}
          isGoingToUnpublish={isGoingToUnpublish}
        />
      )}

      {dialogState === 'create-release' && (
        <CopyToNewReleaseDialog
          onClose={() => setDialogState('idle')}
          onCreateVersion={handleAddVersion}
          documentId={isVersion ? getVersionId(documentId, bundleId) : documentId}
          documentType={documentType}
          release={sourceReleasePerspective}
          title={text}
        />
      )}

      {dialogState === 'copy-to-drafts' && (
        <CopyToDraftsDialog
          onClose={() => setDialogState('idle')}
          documentId={documentId}
          fromRelease={bundleId}
          onNavigate={onCopyToDraftsNavigate}
        />
      )}
      {isScheduledDraft && scheduledDraftMenuActions.dialogs}
    </>
  )
})
