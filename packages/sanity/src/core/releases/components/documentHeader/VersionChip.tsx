import {type ReleaseDocument, type ReleaseState} from '@sanity/client'
import {ComposeSparklesIcon, LockIcon} from '@sanity/icons'
import {
  type BadgeTone,
  Button, // eslint-disable-line no-restricted-imports
  useClickOutsideEvent,
  useGlobalKeyDown,
  useToast,
} from '@sanity/ui'
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
import {styled} from 'styled-components'

import {Popover, Tooltip} from '../../../../ui-components'
import {useCanvasCompanionDocsStore} from '../../../canvas/store/useCanvasCompanionDocsStore'
import {useTranslation} from '../../../i18n'
import {useReleasesToolAvailable} from '../../../schedules/hooks/useReleasesToolAvailable'
import {useScheduledDraftMenuActions} from '../../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {getDraftId, getPublishedId, getVersionId} from '../../../util/draftUtils'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {DiscardVersionDialog} from '../dialog/DiscardVersionDialog'
import {ReleaseAvatarIcon} from '../ReleaseAvatar'
import {VersionContextMenu} from './contextMenu/VersionContextMenu'
import {CopyToDraftsDialog} from './dialog/CopyToDraftsDialog'
import {CopyToNewReleaseDialog} from './dialog/CopyToNewReleaseDialog'

const ChipButtonContainer = styled.span`
  display: inline-flex;
  --border-color: var(--card-border-color);
`

const ChipButton = styled(Button)`
  flex: none;
  transition: none;
  cursor: pointer;
  --card-border-color: var(--border-color);
`

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

/**
 * @internal
 */
export const VersionChip = memo(function VersionChip(props: {
  disabled?: boolean
  selected: boolean
  tooltipContent: ReactNode
  onClick: () => void
  text: string
  tone: BadgeTone
  locked?: boolean
  onCopyToDraftsNavigate: () => void
  contextValues: {
    documentId: string
    releases: ReleaseDocument[]
    releasesLoading: boolean
    documentType: string
    menuReleaseId: string
    fromRelease: string
    releaseState?: ReleaseState
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
    tone,
    locked = false,
    onCopyToDraftsNavigate,
    contextValues: {
      documentId,
      releases,
      releasesLoading,
      documentType,
      menuReleaseId,
      fromRelease,
      isVersion,
      disabled: contextMenuDisabled = false,
      isGoingToUnpublish = false,
      release,
    },
  } = props
  const releasesToolAvailable = useReleasesToolAvailable()
  const isLinked = useVersionIsLinked(documentId, fromRelease)

  const [contextMenuPoint, setContextMenuPoint] = useState<{x: number; y: number} | undefined>(
    undefined,
  )
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [dialogState, setDialogState] = useState<VersionChipDialogState>('idle')

  const chipRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (selected) chipRef.current?.scrollIntoView({inline: 'center'})
  }, [selected])

  const docId = isVersion ? getVersionId(documentId, fromRelease) : documentId // operations recognises publish and draft as empty

  const {createVersion} = useVersionOperations()
  const toast = useToast()
  const {t} = useTranslation()

  const close = useCallback(() => setContextMenuPoint(undefined), [])

  const handleContextMenu = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    setContextMenuPoint({x: event.clientX, y: event.clientY})
  }, [])

  useClickOutsideEvent(
    () => {
      if (contextMenuPoint?.x && contextMenuPoint?.y) {
        close()
      }
    },
    () => [popoverRef.current],
  )

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

  const referenceElement = useMemo(() => {
    if (!contextMenuPoint) {
      return null
    }

    return {
      getBoundingClientRect() {
        return {
          x: contextMenuPoint.x,
          y: contextMenuPoint.y,
          left: contextMenuPoint.x,
          top: contextMenuPoint.y,
          right: contextMenuPoint.x,
          bottom: contextMenuPoint.y,
          width: 0,
          height: 0,
        }
      },
    } as HTMLElement
  }, [contextMenuPoint])

  const contextMenuHandler = disabled || !releasesToolAvailable ? undefined : handleContextMenu

  const isScheduledDraft = release && isVersion && isCardinalityOneRelease(release)
  const scheduledDraftMenuActions = useScheduledDraftMenuActions({
    release,
    documentType,
    documentId,
    disabled: contextMenuDisabled,
  })

  return (
    <>
      <Tooltip content={tooltipContent} fallbackPlacements={[]} portal placement="bottom">
        {/* This span is needed to make the tooltip work in disabled buttons */}
        <ChipButtonContainer>
          <ChipButton
            data-testid={`document-header-${text.replaceAll(' ', '-')}-chip`}
            ref={chipRef}
            disabled={disabled}
            mode={disabled ? 'ghost' : 'bleed'}
            onClick={onClick}
            selected={selected}
            tone={tone}
            onContextMenu={contextMenuHandler}
            paddingY={2}
            paddingLeft={2}
            paddingRight={3}
            space={2}
            radius="full"
            icon={<ReleaseAvatarIcon tone={tone} />}
            iconRight={isLinked ? <ComposeSparklesIcon /> : locked && <LockIcon />}
            text={text}
          />
        </ChipButtonContainer>
      </Tooltip>

      <Popover
        animate={false}
        content={
          <VersionContextMenu
            documentId={documentId}
            releases={releases}
            releasesLoading={releasesLoading}
            fromRelease={fromRelease}
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
        open={Boolean(referenceElement)}
        portal
        placement="bottom-start"
        ref={popoverRef}
        referenceElement={referenceElement}
        zOffset={10}
      />

      {dialogState === 'discard-version' && (
        <DiscardVersionDialog
          onClose={() => setDialogState('idle')}
          documentId={
            isVersion
              ? getVersionId(documentId, getReleaseIdFromReleaseDocumentId(menuReleaseId))
              : documentId
          }
          fromPerspective={text}
          documentType={documentType}
        />
      )}

      {dialogState === 'create-release' && (
        <CopyToNewReleaseDialog
          onClose={() => setDialogState('idle')}
          onCreateVersion={handleAddVersion}
          documentId={
            isVersion
              ? getVersionId(documentId, getReleaseIdFromReleaseDocumentId(menuReleaseId))
              : documentId
          }
          documentType={documentType}
          tone={tone}
          title={text}
        />
      )}

      {dialogState === 'copy-to-drafts' && (
        <CopyToDraftsDialog
          onClose={() => setDialogState('idle')}
          documentId={documentId}
          fromRelease={fromRelease}
          onNavigate={onCopyToDraftsNavigate}
        />
      )}
      {isScheduledDraft && scheduledDraftMenuActions.dialogs}
    </>
  )
})
