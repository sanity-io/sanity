import {useTelemetry} from '@sanity/telemetry/react'
import {type BadgeTone, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {memo, type MouseEvent, type ReactNode, useCallback, useMemo, useRef, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  AddedVersion,
  getCreateVersionOrigin,
  getPublishedId,
  getVersionId,
  type ReleaseDocument,
  useDocumentOperation,
  useDocumentStore,
  usePerspective,
} from 'sanity'
import {styled} from 'styled-components'

import {ReleaseAvatar} from '../../../../../../core/releases/components/ReleaseAvatar'
import {Button, Popover, Tooltip} from '../../../../../../ui-components'
import {VersionContextMenu} from './contextMenu/VersionContextMenu'
import {CreateReleaseDialog} from './dialog/CreateReleaseDialog'
import {DiscardVersionDialog} from './dialog/DiscardVersionDialog'

const Chip = styled(Button)`
  border-radius: 9999px !important;
  transition: none;
  text-decoration: none !important;
  cursor: pointer;

  // target enabled state
  &:not([data-disabled='true']) {
    --card-border-color: var(--card-badge-default-bg-color);
  }
`

export const VersionChip = memo(function VersionChip(props: {
  disabled?: boolean
  selected: boolean
  tooltipContent: ReactNode
  onClick: () => void
  text: string
  tone: BadgeTone
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
  const {setPerspective} = usePerspective()

  const publishedId = getPublishedId(documentId)

  const operationVersion = isVersion ? fromRelease : '' // operations recognises publish and draft as empty

  const {createVersion} = useDocumentOperation(publishedId, documentType, operationVersion)

  const telemetry = useTelemetry()
  const documentStore = useDocumentStore()

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
    async (targetRelease: string) => {
      // set up the listener before executing
      const createVersionSuccess = firstValueFrom(
        documentStore.pair
          .operationEvents(getPublishedId(documentId), documentType)
          .pipe(filter((e) => e.op === 'createVersion' && e.type === 'success')),
      )

      const docId = getVersionId(publishedId, targetRelease)
      const origin = isVersion ? 'version' : getCreateVersionOrigin(fromRelease)

      createVersion.execute(docId, origin)

      // only change if the version was created successfully
      await createVersionSuccess
      setPerspective(targetRelease)

      telemetry.log(AddedVersion, {
        schemaType: documentType,
        documentOrigin: origin,
      })
      close()
    },
    [
      createVersion,
      documentId,
      documentStore.pair,
      documentType,
      fromRelease,
      isVersion,
      publishedId,
      setPerspective,
      telemetry,
      close,
    ],
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
            onCreateVersion={(targetId: string) => {
              handleAddVersion(targetId)
              close()
            }}
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
          documentId={isVersion ? getVersionId(documentId, menuReleaseId) : documentId}
          documentType={documentType}
        />
      )}

      {isCreateReleaseDialogOpen && (
        <CreateReleaseDialog
          onClose={() => setIsCreateReleaseDialogOpen(false)}
          documentId={isVersion ? getVersionId(documentId, menuReleaseId) : documentId}
          documentType={documentType}
          tone={tone}
          title={text}
        />
      )}
    </>
  )
})
