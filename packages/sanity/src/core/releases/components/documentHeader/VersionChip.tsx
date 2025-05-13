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

import {type useFilteredReleases} from '../../../../structure/hooks/useFilteredReleases'
import {Popover, Tooltip} from '../../../../ui-components'
import {useCanvasCompanionDocsStore} from '../../../canvas/store/useCanvasCompanionDocsStore'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {getDraftId, getPublishedId, getVersionId} from '../../../util/draftUtils'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {type ReleaseState} from '../../store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {DiscardVersionDialog} from '../dialog/DiscardVersionDialog'
import {ReleaseAvatarIcon} from '../ReleaseAvatar'
import {VersionContextMenu} from './contextMenu/VersionContextMenu'
import {ConfirmReplaceVersionDialog} from './dialog/ConfirmReplaceVersionDialog'
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

type DialogType = 'replace' | 'discard' | 'create' | null

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
  contextValues: {
    documentId: string
    releases: ReturnType<typeof useFilteredReleases>
    releasesLoading: boolean
    documentType: string
    menuReleaseId: string
    fromRelease: string
    releaseState?: ReleaseState
    isVersion: boolean
    disabled?: boolean
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
      isVersion,
      disabled: contextMenuDisabled = false,
    },
  } = props
  const isLinked = useVersionIsLinked(documentId, fromRelease)

  const [contextMenuPoint, setContextMenuPoint] = useState<{x: number; y: number} | undefined>(
    undefined,
  )
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState<DialogType>(null)
  const [targetRelease, setTargetRelease] = useState<ReleaseDocument | null>(null)
  const {guardWithReleaseLimitUpsell} = useReleasesUpsell()

  const chipRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (selected) chipRef.current?.scrollIntoView({inline: 'center'})
  }, [selected])

  const docId = isVersion ? getVersionId(documentId, fromRelease) : documentId // operations recognises publish and draft as empty

  const {createVersion, replaceVersion} = useVersionOperations()
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
    setIsDialogOpen('discard')
  }, [setIsDialogOpen])

  const openCreateReleaseDialog = useCallback(
    () => guardWithReleaseLimitUpsell(() => setIsDialogOpen('create')),
    [guardWithReleaseLimitUpsell],
  )

  const handleCreateVersion = useCallback(
    async (targetRelease: string) => {
      const existingTargetRelease = releases.currentReleases.find(
        (release) => release._id === targetRelease,
      )
      if (existingTargetRelease) {
        setIsDialogOpen('replace')
        setTargetRelease(existingTargetRelease)
      } else {
        try {
          // await createVersion(getReleaseIdFromReleaseDocumentId(targetRelease), docId)
          console.log('creating version')
        } catch (err) {
          toast.push({
            closable: true,
            status: 'error',
            title: t('release.action.create-version.failure'),
            description: err.message,
          })
        }

        close()
      }
    },
    [close, createVersion, docId, t, toast, releases.currentReleases],
  )

  const handleReplaceVersion = useCallback(async () => {
    try {
      console.log('callibg replace version')
      await replaceVersion(getReleaseIdFromReleaseDocumentId(targetRelease), docId)
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.action.replace-version.failure'),
        description: err.message,
      })
    }

    setTargetRelease(null)
    close()
  }, [close, replaceVersion, targetRelease, docId, toast, t])

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

  const contextMenuHandler = disabled ? undefined : handleContextMenu

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
            onCreateVersion={handleCreateVersion}
            locked={locked}
            type={documentType}
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

      {isDialogOpen === 'discard' && (
        <DiscardVersionDialog
          onClose={() => setIsDialogOpen(null)}
          documentId={
            isVersion
              ? getVersionId(documentId, getReleaseIdFromReleaseDocumentId(menuReleaseId))
              : documentId
          }
          fromPerspective={text}
          documentType={documentType}
        />
      )}

      {isDialogOpen === 'create' && (
        <CopyToNewReleaseDialog
          onClose={() => setIsDialogOpen(null)}
          onCreateVersion={handleCreateVersion}
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
      {isDialogOpen === 'replace' && (
        <ConfirmReplaceVersionDialog
          onClose={() => setIsDialogOpen(null)}
          documentId={documentId}
          documentType={documentType}
          targetRelease={targetRelease}
          onReplaceVersion={handleReplaceVersion}
        />
      )}
    </>
  )
})
