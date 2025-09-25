import {type ReleaseDocument, type ReleaseState} from '@sanity/client'
import {ComposeSparklesIcon, LockIcon} from '@sanity/icons'
import {
  Button, // eslint-disable-line no-restricted-imports
  useClickOutsideEvent,
  useGlobalKeyDown,
  useToast,
} from '@sanity/ui'
import {getVarName, vars} from '@sanity/ui/css'
import {type ElementTone} from '@sanity/ui/theme'
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
import {Translate, useTranslation} from '../../../i18n'
import {getDraftId, getPublishedId, getVersionId} from '../../../util/draftUtils'
import {getErrorMessage} from '../../../util/getErrorMessage'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {useReleasesToolAvailable} from '../../hooks/useReleasesToolAvailable'
import {useScheduleDraftOperations} from '../../hooks/useScheduleDraftOperations'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {DiscardVersionDialog} from '../dialog/DiscardVersionDialog'
import {ScheduleDraftDialog} from '../dialog/ScheduleDraftDialog'
import {ReleaseAvatarIcon} from '../ReleaseAvatar'
import {VersionContextMenu} from './contextMenu/VersionContextMenu'
import {CopyToNewReleaseDialog} from './dialog/CopyToNewReleaseDialog'

const ChipButtonContainer = styled.span`
  display: inline-flex;
  --border-color: ${vars.color.border};
`

const ChipButton = styled(Button)`
  flex: none;
  transition: none;
  cursor: pointer;
  ${getVarName(vars.color.border)}: var(--border-color);
`

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
  tone: ElementTone
  locked?: boolean
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
    contextValues: {
      documentId,
      releases,
      releasesLoading,
      documentType,
      menuReleaseId,
      fromRelease,
      releaseState,
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
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] = useState(false)
  const [isChangeScheduleDialogOpen, setIsChangeScheduleDialogOpen] = useState(false)
  const [isPerformingScheduleOperation, setIsPerformingScheduleOperation] = useState(false)

  const chipRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (selected) chipRef.current?.scrollIntoView({inline: 'center'})
  }, [selected])

  const docId = isVersion ? getVersionId(documentId, fromRelease) : documentId // operations recognises publish and draft as empty

  const {createVersion} = useVersionOperations()
  const toast = useToast()
  const {t} = useTranslation()
  const releaseTitle = release?.metadata.title || t('release.placeholder-untitled-release')
  const operations = useScheduleDraftOperations()

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
    setIsDiscardDialogOpen(true)
  }, [setIsDiscardDialogOpen])

  const openCreateReleaseDialog = useCallback(() => setIsCreateReleaseDialogOpen(true), [])

  const openChangeScheduleDialog = useCallback(() => {
    setIsChangeScheduleDialogOpen(true)
  }, [])

  const handleReschedule = useCallback(
    async (newPublishAt: Date) => {
      if (!release) return

      setIsPerformingScheduleOperation(true)

      try {
        await operations.rescheduleScheduledDraft(release._id, newPublishAt)
        setIsChangeScheduleDialogOpen(false)
      } catch (error) {
        console.error('Failed to reschedule draft:', error)
        toast.push({
          closable: true,
          status: 'error',
          description: (
            <Translate
              t={t}
              i18nKey="release.toast.reschedule-scheduled-draft.error"
              values={{
                title: releaseTitle,
                error: getErrorMessage(error),
              }}
            />
          ),
        })
      } finally {
        setIsPerformingScheduleOperation(false)
      }
    },
    [release, operations, toast, t, releaseTitle],
  )

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
  const canShowScheduleDialog =
    isChangeScheduleDialogOpen && release && isCardinalityOneRelease(release)

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
            gap={2}
            radius="full"
            icon={<ReleaseAvatarIcon tone={tone} />}
            iconRight={isLinked ? <ComposeSparklesIcon /> : locked && <LockIcon />}
            text={text}
          />
        </ChipButtonContainer>
      </Tooltip>

      <Popover
        content={
          <VersionContextMenu
            documentId={documentId}
            releases={releases}
            releasesLoading={releasesLoading}
            fromRelease={fromRelease}
            isVersion={isVersion}
            onDiscard={openDiscardDialog}
            onCreateRelease={openCreateReleaseDialog}
            disabled={contextMenuDisabled}
            onCreateVersion={handleAddVersion}
            locked={locked}
            type={documentType}
            isGoingToUnpublish={isGoingToUnpublish}
            release={release}
            onChangeSchedule={openChangeScheduleDialog}
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

      {isDiscardDialogOpen && (
        <DiscardVersionDialog
          onClose={() => setIsDiscardDialogOpen(false)}
          documentId={
            isVersion
              ? getVersionId(documentId, getReleaseIdFromReleaseDocumentId(menuReleaseId))
              : documentId
          }
          fromPerspective={text}
          documentType={documentType}
        />
      )}

      {isCreateReleaseDialogOpen && (
        <CopyToNewReleaseDialog
          onClose={() => setIsCreateReleaseDialogOpen(false)}
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

      {canShowScheduleDialog && (
        <ScheduleDraftDialog
          onClose={() => !isPerformingScheduleOperation && setIsChangeScheduleDialogOpen(false)}
          onSchedule={handleReschedule}
          variant="edit-schedule"
          loading={isPerformingScheduleOperation}
          initialDate={release.publishAt || release.metadata.intendedPublishAt}
        />
      )}
    </>
  )
})
