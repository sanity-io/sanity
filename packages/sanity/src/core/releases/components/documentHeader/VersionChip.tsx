import {LockIcon} from '@sanity/icons'
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
import {styled} from 'styled-components'

import {Popover, Tooltip} from '../../../../ui-components'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {getVersionId} from '../../../util/draftUtils'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {type ReleaseDocument, type ReleaseState} from '../../store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {DiscardVersionDialog} from '../dialog/DiscardVersionDialog'
import {ReleaseAvatarIcon} from '../ReleaseAvatar'
import {VersionContextMenu} from './contextMenu/VersionContextMenu'
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
    releases: ReleaseDocument[]
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
      releaseState,
      isVersion,
      disabled: contextMenuDisabled = false,
    },
  } = props

  const [contextMenuPoint, setContextMenuPoint] = useState<{x: number; y: number} | undefined>(
    undefined,
  )
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] = useState(false)
  const {guardWithReleaseLimitUpsell} = useReleasesUpsell()

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
    setIsDiscardDialogOpen(true)
  }, [setIsDiscardDialogOpen])

  const openCreateReleaseDialog = useCallback(
    () => guardWithReleaseLimitUpsell(() => setIsCreateReleaseDialogOpen(true)),
    [guardWithReleaseLimitUpsell],
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
            iconRight={locked && <LockIcon />}
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
    </>
  )
})
