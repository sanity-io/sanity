import {
  CheckmarkCircleIcon,
  ClipboardIcon,
  CopyIcon,
  EditIcon,
  TrashIcon,
  UnpublishIcon,
} from '@sanity/icons'
import {Menu, MenuDivider, useClickOutsideEvent, useGlobalKeyDown, useToast} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useCallback, useRef, useState} from 'react'
import {Translate, useDocumentOperation, useDocumentStore, useTranslation} from 'sanity'
import {useRouter} from 'sanity/router'

import {Dialog, MenuItem, Popover} from '../../../../ui-components'
import {structureLocaleNamespace} from '../../../i18n'
import {useDocumentListSelection} from './DocumentListSelectionProvider'
import {executeDocumentOperation, type ListItemOperationName} from './executeDocumentOperation'
import {type DocumentListSelectionContextValue, type PaneItemMenuTarget} from './types'

type ConfirmableAction = 'unpublish' | 'delete'

// Operation disabled-reasons with a dedicated human explanation; anything
// else falls back to the DEFAULT copy.
const KNOWN_DISABLED_REASONS = [
  'NOT_READY',
  'NOTHING_TO_DELETE',
  'NOTHING_TO_DUPLICATE',
  'NOT_PUBLISHED',
  'LIVE_EDIT_ENABLED',
] as const

/**
 * The context menu shared by every row of a document list pane. A single
 * instance is mounted per pane; rows open it (right-click, keyboard menu key,
 * or the row overflow button) by setting the menu target on the selection
 * context. Rendering one menu per pane rather than per row keeps the
 * virtualized list cheap and mounts only one document pair at a time.
 *
 * @internal
 */
export function PaneItemContextMenu() {
  const selection = useDocumentListSelection()

  if (!selection?.itemMenu) return null

  return <PaneItemContextMenuInner selection={selection} target={selection.itemMenu} />
}

function PaneItemContextMenuInner(props: {
  selection: DocumentListSelectionContextValue
  target: PaneItemMenuTarget
}) {
  const {selection, target} = props
  const {closeItemMenu, isSelected, toggle} = selection

  const {t} = useTranslation(structureLocaleNamespace)
  const toast = useToast()
  const {navigateIntent} = useRouter()
  const documentStore = useDocumentStore()
  // Read-only: used for the disabled state of the menu items. Execution goes
  // through `executeDocumentOperation` so the (cold) operations pipeline is
  // subscribed for the duration of the call — a list pane, unlike a document
  // pane, has nothing else subscribing to it.
  const operations = useDocumentOperation(target.documentId, target.documentType)

  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmableAction | null>(null)

  // While the confirm dialog is up, clicks land outside the popover by
  // definition (the dialog is portaled) — closing the menu then would
  // unmount the dialog before its buttons can fire.
  useClickOutsideEvent(
    useCallback(() => {
      if (!confirmAction) closeItemMenu()
    }, [closeItemMenu, confirmAction]),
    () => [popoverRef.current],
  )
  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape' && !confirmAction) closeItemMenu()
      },
      [closeItemMenu, confirmAction],
    ),
  )

  const rowSelected = isSelected(target.documentId)

  const disabledReason = useCallback(
    (reason: string | false) => {
      if (!reason) return null
      const known = (KNOWN_DISABLED_REASONS as readonly string[]).includes(reason)
        ? reason
        : 'DEFAULT'
      return {content: t(`panes.document-list-pane.item-menu.disabled.${known}`)}
    },
    [t],
  )

  const handleOpen = useCallback(() => {
    closeItemMenu()
    navigateIntent('edit', {id: target.documentId, type: target.documentType})
  }, [closeItemMenu, navigateIntent, target])

  const handleToggleSelect = useCallback(() => {
    toggle(target.documentId)
    closeItemMenu()
  }, [closeItemMenu, target, toggle])

  const notifyFailure = useCallback(
    (operationName: ListItemOperationName) => {
      toast.push({
        closable: true,
        status: 'error',
        title: t('panes.document-list-pane.item-menu.operation-failed', {
          operation: t(`panes.document-list-pane.item-menu.${operationName}`),
        }),
      })
    },
    [t, toast],
  )

  const handleDuplicate = useCallback(() => {
    const dupeId = uuid()
    closeItemMenu()
    void executeDocumentOperation(
      documentStore,
      target.documentId,
      target.documentType,
      'duplicate',
      [dupeId],
    ).then((outcome) => {
      if (outcome === 'done') {
        navigateIntent('edit', {id: dupeId, type: target.documentType})
      } else {
        notifyFailure('duplicate')
      }
    })
  }, [closeItemMenu, documentStore, navigateIntent, notifyFailure, target])

  const handleCopyId = useCallback(async () => {
    closeItemMenu()
    await navigator.clipboard.writeText(target.documentId)
    toast.push({
      closable: true,
      status: 'success',
      title: t('panes.document-list-pane.item-menu.copy-id.success'),
    })
  }, [closeItemMenu, t, target, toast])

  const handleConfirm = useCallback(() => {
    const operationName = confirmAction
    setConfirmAction(null)
    closeItemMenu()
    if (!operationName) return
    void executeDocumentOperation(
      documentStore,
      target.documentId,
      target.documentType,
      operationName,
    ).then((outcome) => {
      if (outcome !== 'done') notifyFailure(operationName)
    })
  }, [closeItemMenu, confirmAction, documentStore, notifyFailure, target])

  const handleCancelConfirm = useCallback(() => {
    setConfirmAction(null)
    closeItemMenu()
  }, [closeItemMenu])

  return (
    <>
      <Popover
        animate={false}
        content={
          <Menu shouldFocus="first">
            {/* secondary actions, registry order */}
            <MenuItem
              icon={EditIcon}
              onClick={handleOpen}
              text={t('panes.document-list-pane.item-menu.open')}
            />
            <MenuItem
              icon={CheckmarkCircleIcon}
              onClick={handleToggleSelect}
              text={t(
                rowSelected
                  ? 'panes.document-list-pane.item-menu.deselect'
                  : 'panes.document-list-pane.item-menu.select',
              )}
            />
            <MenuItem
              disabled={Boolean(operations.duplicate.disabled)}
              icon={CopyIcon}
              onClick={handleDuplicate}
              text={t('panes.document-list-pane.item-menu.duplicate')}
              tooltipProps={disabledReason(operations.duplicate.disabled)}
            />
            <MenuItem
              icon={ClipboardIcon}
              onClick={handleCopyId}
              text={t('panes.document-list-pane.item-menu.copy-id')}
            />

            {/* destructive actions, separated below a divider */}
            <MenuDivider />
            <MenuItem
              disabled={Boolean(operations.unpublish.disabled)}
              icon={UnpublishIcon}
              onClick={() => setConfirmAction('unpublish')}
              text={t('panes.document-list-pane.item-menu.unpublish')}
              tone="critical"
              tooltipProps={disabledReason(operations.unpublish.disabled)}
            />
            <MenuItem
              disabled={Boolean(operations.delete.disabled)}
              icon={TrashIcon}
              onClick={() => setConfirmAction('delete')}
              text={t('panes.document-list-pane.item-menu.delete')}
              tone="critical"
              tooltipProps={disabledReason(operations.delete.disabled)}
            />
          </Menu>
        }
        fallbackPlacements={['top-start']}
        open={!confirmAction}
        placement="bottom-start"
        portal
        ref={popoverRef}
        referenceElement={target.element}
        zOffset={10}
        style={
          target.translate
            ? {transform: `translate(${target.translate.x}px, ${target.translate.y}px)`}
            : undefined
        }
      />

      {confirmAction && (
        <Dialog
          header={t(`panes.document-list-pane.item-menu.${confirmAction}.confirm.title`)}
          id="pane-item-confirm-dialog"
          onClose={handleCancelConfirm}
          width={0}
          footer={{
            cancelButton: {onClick: handleCancelConfirm},
            confirmButton: {
              onClick: handleConfirm,
              text: t(`panes.document-list-pane.item-menu.${confirmAction}.confirm.button`),
              tone: 'critical',
            },
          }}
        >
          <Translate
            t={t}
            i18nKey={`panes.document-list-pane.item-menu.${confirmAction}.confirm.description`}
          />
        </Dialog>
      )}
    </>
  )
}
