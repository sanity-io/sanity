import {LockIcon} from '@sanity/icons'
import {type BadgeTone, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
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

import {Button, Popover, Tooltip} from '../../../../ui-components'
import {getVersionId} from '../../../util/draftUtils'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {type ReleaseDocument} from '../../store/types'
import {getBundleIdFromReleaseDocumentId} from '../../util/getBundleIdFromReleaseDocumentId'
import {getReleaseIdFromReleaseDocumentId, type ReleaseDocumentId} from '../../util/releaseId'
import {DiscardVersionDialog} from '../dialog/DiscardVersionDialog'
import {ReleaseAvatar} from '../ReleaseAvatar'
import {VersionContextMenu} from './contextMenu/VersionContextMenu'
import {CopyToNewReleaseDialog} from './dialog/CopyToNewReleaseDialog'

const Chip = styled(Button)`
  border-radius: 9999px !important;
  transition: none;
  text-decoration: none !important;
  cursor: pointer;

  // target enabled state
  &:not([data-disabled='true']) {
    --card-border-color: var(--card-badge-default-bg-color);
  }

  &[data-disabled='true'] {
    color: var(--card-muted-fg-color);
  }
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

  const [contextMenuPoint, setContextMenuPoint] = useState<{x: number; y: number} | undefined>(
    undefined,
  )
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] = useState(false)

  const chipRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (selected) chipRef.current?.scrollIntoView({inline: 'center'})
  }, [selected])

  const docId = isVersion ? getVersionId(documentId, fromRelease) : documentId // operations recognises publish and draft as empty

  const {createVersion} = useVersionOperations()

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

  const openCreateReleaseDialog = useCallback(() => {
    setIsCreateReleaseDialogOpen(true)
  }, [setIsCreateReleaseDialogOpen])

  const handleAddVersion = useCallback(
    async (targetRelease: ReleaseDocumentId) => {
      await createVersion(getReleaseIdFromReleaseDocumentId(targetRelease), docId)
      close()
    },
    [createVersion, docId, close],
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

  return (
    <>
      <Tooltip content={tooltipContent} fallbackPlacements={[]} portal placement="bottom">
        <Chip
          ref={(ref) => (chipRef.current = ref)}
          disabled={disabled}
          mode="bleed"
          onClick={onClick}
          padding={2}
          paddingRight={3}
          selected={selected}
          style={{flex: 'none'}}
          text={text}
          tone={tone}
          icon={<ReleaseAvatar padding={1} tone={tone} />}
          iconRight={locked && LockIcon}
          onContextMenu={handleContextMenu}
        />
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
              ? getVersionId(documentId, getBundleIdFromReleaseDocumentId(menuReleaseId))
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
              ? getVersionId(documentId, getBundleIdFromReleaseDocumentId(menuReleaseId))
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
