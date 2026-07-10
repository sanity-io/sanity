import {
  AddCircleIcon,
  ClipboardIcon,
  CloseIcon,
  CopyIcon,
  PublishIcon,
  ResetIcon,
  TrashIcon,
  UnpublishIcon,
} from '@sanity/icons'
import {Flex, Menu, MenuDivider, Stack, Text, useGlobalKeyDown, useToast} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useCallback, useId, useState} from 'react'
import {
  ContextMenuButton,
  getMockBatch,
  getReleaseIdFromReleaseDocumentId,
  isProposalResolved,
  openBatch,
  Translate,
  useActiveReleases,
  useConfidenceStoreVersion,
  useDocumentStore,
  useTranslation,
  useVersionOperations,
} from 'sanity'

import {Button, Dialog, MenuButton, MenuGroup, MenuItem} from '../../../../ui-components'
import {PaneFooter} from '../../../components/pane'
import {structureLocaleNamespace} from '../../../i18n'
import {useDocumentListSelection} from './DocumentListSelectionProvider'
import {executeDocumentOperation} from './executeDocumentOperation'

type BulkOperationName = 'publish' | 'unpublish' | 'delete' | 'discardChanges' | 'duplicate'

// The i18n key segment for each bulk operation's labels/results.
const OPERATION_KEY: Record<BulkOperationName, string> = {
  publish: 'publish',
  unpublish: 'unpublish',
  delete: 'delete',
  discardChanges: 'discard',
  duplicate: 'duplicate',
}

interface BulkResult {
  done: number
  skipped: number
}

/**
 * The bulk action bar for a document list pane. Swaps into the pane footer
 * while one or more rows are selected — the list's own operating surface,
 * deliberately separate from the document pane's status bar (those are the
 * single document's actions; these act on the selection). Actions run
 * through the same operations pipeline as the single-document actions, per
 * selected document.
 *
 * @internal
 */
export function DocumentListBulkActionBar() {
  const selection = useDocumentListSelection()
  const documentStore = useDocumentStore()
  const toast = useToast()
  const {t} = useTranslation(structureLocaleNamespace)
  const {data: activeReleases} = useActiveReleases()
  const {createVersion} = useVersionOperations()
  const overflowMenuId = useId()

  const [busyAction, setBusyAction] = useState<BulkOperationName | 'addToRelease' | null>(null)
  const [confirmingAction, setConfirmingAction] = useState<'delete' | 'discardChanges' | null>(null)

  const selectedIds = selection?.selectedIds
  const selectionActive = Boolean(selection?.selectionActive)
  const count = selectedIds?.length ?? 0

  // Confidence queue (overhaul prototype): the pane's mock agent batch,
  // minus anything already resolved this session.
  useConfidenceStoreVersion()
  const paneBatch =
    selection && selection.listItems.length > 0
      ? getMockBatch(selection.paneKey, selection.listItems)
      : null
  const pendingBatchCount =
    paneBatch?.proposals.filter((proposal) => !isProposalResolved(proposal.id)).length ?? 0

  // Cmd/Ctrl+A extends to the whole loaded set once selection mode is active.
  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (!selectionActive || !selection) return
        const target = event.target as HTMLElement | null
        const inEditable =
          target &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        if ((event.metaKey || event.ctrlKey) && event.key === 'a' && !inEditable) {
          event.preventDefault()
          selection.selectAll()
        }
      },
      [selection, selectionActive],
    ),
  )

  const runBulk = useCallback(
    async (operationName: BulkOperationName) => {
      if (!selection || selection.selectedIds.length === 0) return
      setBusyAction(operationName)
      try {
        const result: BulkResult = {done: 0, skipped: 0}
        for (const publishedId of selection.selectedIds) {
          const documentType = selection.getItemType(publishedId)
          if (!documentType) {
            result.skipped++
            continue
          }
          const extraArgs = operationName === 'duplicate' ? [uuid()] : []
          const outcome = await executeDocumentOperation(
            documentStore,
            publishedId,
            documentType,
            operationName,
            extraArgs,
          )
          if (outcome === 'done') {
            result.done++
          } else {
            result.skipped++
          }
        }

        toast.push({
          closable: true,
          status: result.done > 0 ? 'success' : 'warning',
          title: t(`panes.document-list-pane.bulk-bar.${OPERATION_KEY[operationName]}.result`, {
            count: result.done,
          }),
          description:
            result.skipped > 0
              ? t('panes.document-list-pane.bulk-bar.result.skipped', {count: result.skipped})
              : undefined,
        })
        selection.clearSelection()
      } finally {
        setBusyAction(null)
      }
    },
    // oxlint-disable-next-line react/react-compiler
    [documentStore, selection, t, toast],
  )

  const handleAddToRelease = useCallback(
    async (releaseDocumentId: string, releaseTitle: string) => {
      if (!selection || selection.selectedIds.length === 0) return
      setBusyAction('addToRelease')
      try {
        const releaseId = getReleaseIdFromReleaseDocumentId(releaseDocumentId)
        let done = 0
        for (const publishedId of selection.selectedIds) {
          try {
            await createVersion(releaseId, publishedId)
            done++
          } catch {
            // counted below as skipped
          }
        }
        toast.push({
          closable: true,
          status: done > 0 ? 'success' : 'warning',
          title: t('panes.document-list-pane.bulk-bar.add-to-release.result', {
            count: done,
            release: releaseTitle,
          }),
          description:
            done < selection.selectedIds.length
              ? t('panes.document-list-pane.bulk-bar.result.skipped', {
                  count: selection.selectedIds.length - done,
                })
              : undefined,
        })
        selection.clearSelection()
      } finally {
        setBusyAction(null)
      }
    },
    // oxlint-disable-next-line react/react-compiler
    [createVersion, selection, t, toast],
  )

  const handleCopyIds = useCallback(async () => {
    if (!selection) return
    await navigator.clipboard.writeText(selection.selectedIds.join('\n'))
    toast.push({
      closable: true,
      status: 'success',
      title: t('panes.document-list-pane.bulk-bar.copy-ids.result', {
        count: selection.selectedIds.length,
      }),
    })
  }, [selection, t, toast])

  const handlePublish = useCallback(() => void runBulk('publish'), [runBulk])
  const handleUnpublish = useCallback(() => void runBulk('unpublish'), [runBulk])
  const handleConfirm = useCallback(() => {
    const action = confirmingAction
    setConfirmingAction(null)
    if (action) void runBulk(action)
  }, [confirmingAction, runBulk])

  if (!selection || !selectionActive) return null

  const busy = busyAction !== null

  return (
    <PaneFooter padding={2}>
      <Stack space={2}>
        <Flex align="center" gap={1}>
          <Flex align="center" flex={1} gap={1} paddingLeft={2}>
            <Text muted size={1} weight="medium">
              {t('panes.document-list-pane.bulk-bar.selected', {count})}
            </Text>
          </Flex>
          {pendingBatchCount > 0 && paneBatch && (
            <Button
              disabled={busy}
              mode="bleed"
              onClick={() => openBatch(paneBatch)}
              text={t('panes.document-list-pane.bulk-bar.review-proposals', {
                count: pendingBatchCount,
              })}
              tone="primary"
            />
          )}
          {count < selection.itemCount && (
            <Button
              disabled={busy}
              mode="bleed"
              onClick={selection.selectAll}
              text={t('panes.document-list-pane.bulk-bar.select-all', {
                count: selection.itemCount,
              })}
            />
          )}
          <Button
            disabled={busy}
            icon={CloseIcon}
            mode="bleed"
            onClick={selection.clearSelection}
            tooltipProps={{content: t('panes.document-list-pane.bulk-bar.clear')}}
          />
        </Flex>

        <Flex align="center" gap={1}>
          <Button
            disabled={busy}
            loading={busyAction === 'publish'}
            icon={PublishIcon}
            mode="ghost"
            onClick={handlePublish}
            text={t('panes.document-list-pane.bulk-bar.publish')}
            tone="positive"
          />
          <Button
            disabled={busy}
            loading={busyAction === 'unpublish'}
            icon={UnpublishIcon}
            mode="ghost"
            onClick={handleUnpublish}
            text={t('panes.document-list-pane.bulk-bar.unpublish')}
            tone="caution"
          />
          <Button
            disabled={busy}
            loading={busyAction === 'delete'}
            icon={TrashIcon}
            mode="ghost"
            onClick={() => setConfirmingAction('delete')}
            text={t('panes.document-list-pane.bulk-bar.delete')}
            tone="critical"
          />
          {/* secondary bulk actions, rank-ordered: secondary → divider → destructive */}
          <MenuButton
            button={<ContextMenuButton disabled={busy} loading={busyAction === 'addToRelease'} />}
            id={overflowMenuId}
            menu={
              <Menu>
                <MenuGroup
                  icon={AddCircleIcon}
                  popover={{placement: 'right-start', portal: true}}
                  text={t('panes.document-list-pane.bulk-bar.add-to-release')}
                >
                  {activeReleases.length === 0 && (
                    <MenuItem
                      disabled
                      text={t('panes.document-list-pane.bulk-bar.add-to-release.empty')}
                    />
                  )}
                  {activeReleases.map((release) => (
                    <MenuItem
                      key={release._id}
                      onClick={() =>
                        void handleAddToRelease(release._id, release.metadata?.title ?? release._id)
                      }
                      text={release.metadata?.title ?? release._id}
                    />
                  ))}
                </MenuGroup>
                <MenuItem
                  icon={CopyIcon}
                  onClick={() => void runBulk('duplicate')}
                  text={t('panes.document-list-pane.bulk-bar.duplicate')}
                />
                <MenuItem
                  icon={ClipboardIcon}
                  onClick={() => void handleCopyIds()}
                  text={t('panes.document-list-pane.bulk-bar.copy-ids')}
                />
                <MenuDivider />
                <MenuItem
                  icon={ResetIcon}
                  onClick={() => setConfirmingAction('discardChanges')}
                  text={t('panes.document-list-pane.bulk-bar.discard')}
                  tone="critical"
                />
              </Menu>
            }
            popover={{placement: 'top-end', portal: true}}
          />
        </Flex>
      </Stack>

      {confirmingAction && (
        <Dialog
          header={t(
            `panes.document-list-pane.bulk-bar.${OPERATION_KEY[confirmingAction]}.confirm.title`,
            {count},
          )}
          id="bulk-confirm-dialog"
          onClose={() => setConfirmingAction(null)}
          width={0}
          footer={{
            cancelButton: {onClick: () => setConfirmingAction(null)},
            confirmButton: {
              onClick: handleConfirm,
              text: t(`panes.document-list-pane.bulk-bar.${OPERATION_KEY[confirmingAction]}`),
              tone: 'critical',
            },
          }}
        >
          <Translate
            t={t}
            i18nKey={`panes.document-list-pane.bulk-bar.${OPERATION_KEY[confirmingAction]}.confirm.description`}
            values={{count}}
          />
        </Dialog>
      )}
    </PaneFooter>
  )
}
