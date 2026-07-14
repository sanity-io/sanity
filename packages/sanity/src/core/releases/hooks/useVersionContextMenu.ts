import {type ReleaseDocument} from '@sanity/client'
import {useClickOutsideEvent, useGlobalKeyDown, useToast} from '@sanity/ui'
import {type MouseEvent, type RefObject, useCallback, useRef, useState} from 'react'

import {useTranslation} from '../../i18n'
import {type TargetPerspective} from '../../perspective/types'
import {useSingleDocRelease} from '../../singleDocRelease/context/SingleDocReleaseProvider'
import {useClearScheduledDraftPerspectiveOnDelete} from '../../singleDocRelease/hooks/useClearScheduledDraftPerspectiveOnDelete'
import {
  useScheduledDraftMenuActions,
  type UseScheduledDraftMenuActionsReturn,
} from '../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {getVersionId} from '../../util/draftUtils'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {LATEST, PUBLISHED} from '../util/const'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {useVersionOperations} from './useVersionOperations'

const CONTEXT_MENU_CLOSED = {open: false as const}

/**
 * The dialog currently opened from the version context menu.
 *
 * @internal
 */
export type VersionContextMenuDialogState =
  | 'idle'
  | 'discard-version'
  | 'create-release'
  | 'copy-to-drafts'

/**
 * Whether the version context menu is open and, if so, its offset from the
 * reference element.
 *
 * @internal
 */
export type VersionContextMenuState =
  | {open: true; translate: {x: number; y: number}}
  | {open: false}

/**
 * @internal
 */
export interface UseVersionContextMenuOptions {
  documentId: string
  documentType: string
  /** The perspective the menu acts on: 'published', 'draft', or a release ID. */
  bundleId: string
  isVersion: boolean
  /** Disables the menu actions (the menu can still be opened). */
  disabled?: boolean
  release?: ReleaseDocument
}

/**
 * @internal
 */
export interface UseVersionContextMenuReturn {
  /** Whether the menu is open and, if so, its offset from the reference element. */
  contextMenu: VersionContextMenuState
  /** Attach to the `onContextMenu` event of the trigger element. */
  handleContextMenu: (event: MouseEvent<HTMLButtonElement>) => void
  closeContextMenu: () => void
  /** Attach to the popover rendering the menu (used for click-outside detection). */
  popoverRef: RefObject<HTMLDivElement | null>
  /** The element the menu popover is positioned relative to. */
  referenceElement: HTMLElement | null
  setReferenceElement: (element: HTMLElement | null) => void
  dialogState: VersionContextMenuDialogState
  closeDialog: () => void
  openDiscardDialog: () => void
  openCreateReleaseDialog: () => void
  openCopyToDraftsDialog: () => void
  /** Creates a version of the document in the given release and closes the menu. */
  handleAddVersion: (targetRelease: string) => Promise<void>
  isScheduledDraft: boolean
  scheduledDraftMenuActions: UseScheduledDraftMenuActionsReturn
  /** The release or system bundle the menu acts on behalf of. */
  sourceReleasePerspective: TargetPerspective
}

/**
 * Manages the state and actions backing a version context menu: menu
 * open/position state, dialog state, version creation and scheduled draft
 * actions.
 *
 * Render the menu and its dialogs with `VersionContextMenuPopover` and
 * `VersionContextMenuDialogs`.
 *
 * @internal
 */
export function useVersionContextMenu(
  options: UseVersionContextMenuOptions,
): UseVersionContextMenuReturn {
  const {documentId, documentType, bundleId, isVersion, disabled = false, release} = options

  const [contextMenu, setContextMenu] = useState<VersionContextMenuState>({open: false})
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const [dialogState, setDialogState] = useState<VersionContextMenuDialogState>('idle')

  const docId = isVersion ? getVersionId(documentId, bundleId) : documentId // operations recognises publish and draft as empty

  const {createVersion} = useVersionOperations()
  const toast = useToast()
  const {t} = useTranslation()
  const {onSetScheduledDraftPerspective} = useSingleDocRelease()

  const closeContextMenu = useCallback(() => setContextMenu(CONTEXT_MENU_CLOSED), [])

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

  useClickOutsideEvent(closeContextMenu, () => [popoverRef.current])

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (event.key === 'Escape') {
          closeContextMenu()
        }
      },
      [closeContextMenu],
    ),
  )

  const closeDialog = useCallback(() => {
    setDialogState('idle')
  }, [])

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

      closeContextMenu()
    },
    [closeContextMenu, createVersion, docId, t, toast],
  )

  const isScheduledDraft = Boolean(release && isVersion && isCardinalityOneRelease(release))

  const handleEditScheduleComplete = useCallback(() => {
    if (!release) return
    onSetScheduledDraftPerspective(getReleaseIdFromReleaseDocumentId(release._id))
  }, [release, onSetScheduledDraftPerspective])

  const onDeleteComplete = useClearScheduledDraftPerspectiveOnDelete(release)

  const scheduledDraftMenuActions = useScheduledDraftMenuActions({
    release,
    documentType,
    documentId,
    disabled,
    onActionComplete: handleEditScheduleComplete,
    onDeleteComplete,
  })

  const sourceReleasePerspective =
    release ?? (bundleId === 'published' ? PUBLISHED : bundleId === 'draft' ? LATEST : bundleId)

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
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
  }
}
