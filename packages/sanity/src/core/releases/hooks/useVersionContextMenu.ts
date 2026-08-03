import {useClickOutsideEvent, useGlobalKeyDown, useToast} from '@sanity/ui'
import {type MouseEvent, type RefObject, useCallback, useMemo, useRef, useState} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type TargetPerspective} from '../../perspective/types'
import {useSetPerspective} from '../../perspective/useSetPerspective'
import {useSetVariant} from '../../perspective/useSetVariant'
import {useSingleDocRelease} from '../../singleDocRelease/context/SingleDocReleaseProvider'
import {useClearScheduledDraftPerspectiveOnDelete} from '../../singleDocRelease/hooks/useClearScheduledDraftPerspectiveOnDelete'
import {
  useScheduledDraftMenuActions,
  type UseScheduledDraftMenuActionsReturn,
} from '../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {isDocumentGroupId} from '../../util/draftUtils'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {useVariantDocumentOperations} from '../../variants/hooks/useVariantDocumentOperations'
import {isVariantId} from '../../variants/types'
import {type VersionInfoDocumentStub} from '../store/types'
import {useAllReleases} from '../store/useAllReleases'
import {LATEST, PUBLISHED} from '../util/const'
import {
  getReleaseIdFromReleaseDocumentId,
  isReleaseDocumentId,
} from '../util/getReleaseIdFromReleaseDocumentId'
import {type CopyToDraftsOptions, useCopyToDrafts} from './useCopyToDrafts'
import {useDocumentVersions} from './useDocumentVersions'
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

interface UseVersionContextMenuBaseOptions {
  /**
   * The document group id (published id with no `drafts.` / `versions.` prefix).
   */
  documentGroupId: string
  documentType: string
  /** Disables the menu actions (the menu can still be opened). */
  disabled?: boolean
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
type UseVersionContextMenuOptions =
  | (UseVersionContextMenuBaseOptions & {
      /**
       * The version id (with `drafts.` / `versions.` prefix) or even the published id (with no prefix).
       * AKA the full document id
       *
       * Provided by the legacy VersionChip
       */
      versionId: string
      documentVersionInfoStub?: undefined
    })
  | (UseVersionContextMenuBaseOptions & {
      /**
       * Will be used if provided, for example coming from the document group inventory.
       * If not provided, the versionId will be used to find it.
       *
       * Provided by the document group inventory
       */
      documentVersionInfoStub: VersionInfoDocumentStub
      versionId?: undefined
    })

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
    disabled = false,
    documentVersionInfoStub: _documentVersionInfoStub,
    onCopyToDraftsComplete,
  } = options

  const {map: releasesMap} = useAllReleases()
  const {versions} = useDocumentVersions({documentId: documentGroupId})
  const documentVersionInfoStub = useMemo(() => {
    if (_documentVersionInfoStub) return _documentVersionInfoStub

    return versions.find((version) => version._id === versionId)
  }, [versions, versionId, _documentVersionInfoStub])

  const releaseRef = documentVersionInfoStub?._system.release?._ref
  const release = releaseRef ? releasesMap.get(releaseRef) : undefined

  if (process.env.NODE_ENV !== 'production' && !isDocumentGroupId(documentGroupId)) {
    console.warn(
      `useVersionContextMenu: expected a document group id, got "${documentGroupId}". Pass the group (published) id as \`documentGroupId\` and the full document id as \`versionId\`.`,
    )
  }

  const {createVariantDocument} = useVariantDocumentOperations()

  const stubVariantRef = documentVersionInfoStub?._system.variant?._ref
  const variantRef = isVariantId(stubVariantRef) ? stubVariantRef : undefined

  const [contextMenu, setContextMenu] = useState<VersionContextMenuState>({open: false})
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const [dialogState, setDialogState] = useState<VersionContextMenuDialogState>('idle')

  const {createVersion} = useVersionOperations()
  const toast = useToast()
  const {t} = useTranslation()
  const {onSetScheduledDraftPerspective} = useSingleDocRelease()
  const setPerspective = useSetPerspective()
  const setVariant = useSetVariant()

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
    if (variantRef) {
      // Keep the variant applied, otherwise the copy lands out of view.
      setVariant({variantId: variantRef, perspective: 'drafts'})
    } else {
      setPerspective('drafts')
    }
    onCopyToDraftsComplete?.()
  }, [variantRef, setVariant, setPerspective, onCopyToDraftsComplete])

  const {handleCopyToDrafts} = useCopyToDrafts({
    documentGroupId,
    documentVersionInfoStub,
    onNavigate: handleCopyToDraftsNavigate,
    onConfirmationRequest: () => setDialogState('copy-to-drafts'),
  })

  const handleAddVersion = useCallback(
    async (targetRelease: string) => {
      // Menu items and the create release dialog pass a release document id, but a bare
      // release id is accepted too so every branch addresses the release the same way.
      const perspective = isReleaseDocumentId(targetRelease)
        ? getReleaseIdFromReleaseDocumentId(targetRelease)
        : targetRelease
      const runCreateVersion = async () => {
        if (!documentVersionInfoStub?._id) {
          throw new Error('Document version info stub is required')
        }

        if (variantRef) {
          // A variant version can only be created through the variant action, otherwise
          // the new version would not belong to the variant.
          await createVariantDocument({
            baseId: documentVersionInfoStub._id,
            documentGroupId,
            variant: {_id: variantRef},
            selectedPerspective: perspective,
          })
        } else {
          await createVersion(perspective, documentVersionInfoStub._id)
        }
      }

      try {
        await runCreateVersion()
        // Navigates to the new created version
        setVariant({variantId: variantRef, perspective})
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
    [
      closeContextMenu,
      createVersion,
      documentGroupId,
      setVariant,
      variantRef,
      t,
      toast,
      createVariantDocument,
      documentVersionInfoStub,
    ],
  )

  const isScheduledDraft = Boolean(release && isCardinalityOneRelease(release))

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

  // A published stub omits `_system.bundleId`, so it can only be told apart from a version
  // that doesn't exist yet (drafts, the only chip rendered without a document) by the stub.
  const sourceReleasePerspective =
    release ??
    (documentVersionInfoStub ? (documentVersionInfoStub._system.bundleId ?? PUBLISHED) : LATEST)

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
