import {type ReleaseDocument} from '@sanity/client'
import {useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type MouseEvent, type RefObject, useCallback, useRef, useState} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type TargetPerspective} from '../../perspective/types'
import {useSetPerspective} from '../../perspective/useSetPerspective'
import {useSingleDocRelease} from '../../singleDocRelease/context/SingleDocReleaseProvider'
import {useClearScheduledDraftPerspectiveOnDelete} from '../../singleDocRelease/hooks/useClearScheduledDraftPerspectiveOnDelete'
import {
  useScheduledDraftMenuActions,
  type UseScheduledDraftMenuActionsReturn,
} from '../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {isDocumentGroupId} from '../../util/draftUtils'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {LATEST, PUBLISHED} from '../util/const'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {type CopyToDraftsOptions, useCopyToDrafts} from './useCopyToDrafts'
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
  /**
   * The document group id (published id with no `drafts.` / `versions.` prefix).
   */
  documentGroupId: string
  /**
   * The version id (with `drafts.` / `versions.` prefix) or even the published id (with no prefix).
   * AKA the full document id
   */
  versionId: string
  documentType: string
  /** The perspective the menu acts on: 'published', 'draft', or a release ID. */
  bundleId: string
  isVersion: boolean
  /** Disables the menu actions (the menu can still be opened). */
  disabled?: boolean
  release?: ReleaseDocument
  /**
   * Called after a successful copy-to-drafts (after navigating to drafts).
   * Structure uses this to clear the pane-local scheduled draft perspective
   * when needed.
   */
  onCopyToDraftsComplete?: () => void
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
  /**
   * Copies the version to drafts. Pass `shouldConfirmDraftDiscard: true` from
   * the menu to open a confirm dialog when a draft already exists; pass
   * `false` from the dialog confirm action to proceed without prompting.
   */
  handleCopyToDrafts: (options: CopyToDraftsOptions) => Promise<void>
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
  const {
    documentGroupId,
    versionId,
    documentType,
    bundleId,
    isVersion,
    disabled = false,
    release,
    onCopyToDraftsComplete,
  } = options

  if (process.env.NODE_ENV !== 'production' && !isDocumentGroupId(documentGroupId)) {
    console.warn(
      `useVersionContextMenu: expected a document group id, got "${documentGroupId}". Pass the group (published) id as \`documentGroupId\` and the full document id as \`versionId\`.`,
    )
  }

  const [contextMenu, setContextMenu] = useState<VersionContextMenuState>({open: false})
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const [dialogState, setDialogState] = useState<VersionContextMenuDialogState>('idle')

  const {createVersion} = useVersionOperations()
  const toast = useToast()
  const {t} = useTranslation()
  const {onSetScheduledDraftPerspective} = useSingleDocRelease()
  const setPerspective = useSetPerspective()

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

  const handleCopyToDraftsNavigate = useCallback(() => {
    setPerspective('drafts')
    onCopyToDraftsComplete?.()
  }, [setPerspective, onCopyToDraftsComplete])

  const {handleCopyToDrafts} = useCopyToDrafts({
    documentId: documentGroupId,
    fromRelease: bundleId,
    onNavigate: handleCopyToDraftsNavigate,
    onConfirmationRequest: () => setDialogState('copy-to-drafts'),
  })

  const handleAddVersion = useCallback(
    async (targetRelease: string) => {
      try {
        await createVersion(getReleaseIdFromReleaseDocumentId(targetRelease), versionId)
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
    [closeContextMenu, createVersion, versionId, t, toast],
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
    documentId: documentGroupId,
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
    handleCopyToDrafts,
    handleAddVersion,
    isScheduledDraft,
    scheduledDraftMenuActions,
    sourceReleasePerspective,
  }
}
