import {ArchiveIcon} from '@sanity/icons/Archive'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {TrashIcon} from '@sanity/icons/Trash'
import {Flex, Menu, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button, Dialog, MenuButton, MenuItem} from '../../../../ui-components'
import {Translate, useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store/useReleaseOperations'

type BulkAction = 'archive' | 'delete'

// Per-action copy + tone, so one confirm dialog serves both. Archive is reversible (unarchive);
// delete is permanent. Duplicate/Schedule are intentionally NOT bulk actions: duplicate needs each
// release's documents (a per-release fetch, not loopable over a selection), and scheduling many to
// one time collides (releases publish one at a time) — both stay in the per-row menu.
const ACTION_CONFIG: Record<
  BulkAction,
  {
    icon: typeof ArchiveIcon
    tone?: 'critical'
    labelKey: string
    testId: string
    headerKey: string
    confirmKey: string
    descriptionKey: string
    toastSuccessKey: string
    toastErrorKey: string
    confirmTone: 'caution' | 'critical'
  }
> = {
  archive: {
    icon: ArchiveIcon,
    labelKey: 'overview.bulk.archive',
    testId: 'release-overview-bulk-archive',
    headerKey: 'overview.bulk.archive-dialog.header',
    confirmKey: 'overview.bulk.archive-dialog.confirm',
    descriptionKey: 'overview.bulk.archive-dialog.description',
    toastSuccessKey: 'overview.bulk.archive-toast.success',
    toastErrorKey: 'overview.bulk.archive-toast.error',
    confirmTone: 'caution',
  },
  delete: {
    icon: TrashIcon,
    tone: 'critical',
    labelKey: 'overview.bulk.delete',
    testId: 'release-overview-bulk-delete',
    headerKey: 'overview.bulk.delete-dialog.header',
    confirmKey: 'overview.bulk.delete-dialog.confirm',
    descriptionKey: 'overview.bulk.delete-dialog.description',
    toastSuccessKey: 'overview.bulk.delete-toast.success',
    toastErrorKey: 'overview.bulk.delete-toast.error',
    confirmTone: 'critical',
  },
}

/**
 * Bulk-action toolbar contents for the releases overview, rendered inside the DocumentTable command
 * lane when a selection exists. Mirrors the detail-page bulk toolbar (ghost buttons when wide, an
 * overflow menu when compact). Ships Archive (reversible) + Delete (permanent, critical-toned); each
 * opens a confirmation before running across the selection.
 */
export function ReleaseBulkActions({
  selectedIds,
  compact,
  onClear,
}: {
  selectedIds: string[]
  compact: boolean
  onClear: () => void
}): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {archive, deleteRelease} = useReleaseOperations()
  const toast = useToast()
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const count = selectedIds.length

  const runAction = useCallback(async () => {
    if (!pendingAction) return
    const config = ACTION_CONFIG[pendingAction]
    const run = pendingAction === 'archive' ? archive : deleteRelease

    setIsRunning(true)
    const results = await Promise.allSettled(selectedIds.map((id) => run(id)))
    const failed = results.filter((result) => result.status === 'rejected').length
    const succeeded = count - failed

    setIsRunning(false)
    setPendingAction(null)

    if (succeeded > 0) {
      toast.push({
        closable: true,
        status: 'success',
        title: (
          <Text muted size={1}>
            {t(config.toastSuccessKey, {count: succeeded})}
          </Text>
        ),
      })
    }
    if (failed > 0) {
      toast.push({
        closable: true,
        status: 'error',
        title: (
          <Text muted size={1}>
            {t(config.toastErrorKey)}
          </Text>
        ),
      })
    }
    onClear()
  }, [archive, count, deleteRelease, onClear, pendingAction, selectedIds, t, toast])

  const archiveConfig = ACTION_CONFIG.archive
  const deleteConfig = ACTION_CONFIG.delete

  const actions = compact ? (
    <MenuButton
      id="release-overview-bulk-more"
      button={
        <Button
          data-testid="release-overview-bulk-more"
          icon={EllipsisHorizontalIcon}
          mode="bleed"
          tooltipProps={{content: t('overview.bulk.more')}}
        />
      }
      menu={
        <Menu>
          <MenuItem
            data-testid={archiveConfig.testId}
            icon={archiveConfig.icon}
            onClick={() => setPendingAction('archive')}
            text={t(archiveConfig.labelKey)}
          />
          <MenuItem
            data-testid={deleteConfig.testId}
            icon={deleteConfig.icon}
            onClick={() => setPendingAction('delete')}
            text={t(deleteConfig.labelKey)}
            tone="critical"
          />
        </Menu>
      }
      popover={{placement: 'bottom-end', portal: true}}
    />
  ) : (
    <Flex align="center" flex="none" gap={2}>
      <Button
        data-testid={archiveConfig.testId}
        icon={archiveConfig.icon}
        mode="ghost"
        onClick={() => setPendingAction('archive')}
        text={t(archiveConfig.labelKey)}
      />
      <Button
        data-testid={deleteConfig.testId}
        icon={deleteConfig.icon}
        mode="ghost"
        onClick={() => setPendingAction('delete')}
        text={t(deleteConfig.labelKey)}
        tone="critical"
      />
    </Flex>
  )

  return (
    <>
      {actions}
      {pendingAction && (
        <Dialog
          id="release-overview-bulk-action-dialog"
          data-testid="release-overview-bulk-action-dialog"
          header={t(ACTION_CONFIG[pendingAction].headerKey)}
          onClose={() => !isRunning && setPendingAction(null)}
          padding={false}
          footer={{
            confirmButton: {
              text: t(ACTION_CONFIG[pendingAction].confirmKey),
              tone: ACTION_CONFIG[pendingAction].confirmTone,
              onClick: runAction,
              loading: isRunning,
              disabled: isRunning,
            },
            cancelButton: {
              disabled: isRunning,
            },
          }}
        >
          <Stack space={4} paddingX={4} paddingY={4}>
            <Text muted size={1}>
              <Translate
                t={t}
                i18nKey={ACTION_CONFIG[pendingAction].descriptionKey}
                values={{count}}
              />
            </Text>
          </Stack>
        </Dialog>
      )}
    </>
  )
}
