import {ArchiveIcon} from '@sanity/icons/Archive'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {TrashIcon} from '@sanity/icons/Trash'
import {Flex, Menu, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button, Dialog, MenuButton, MenuItem} from '../../../../ui-components'
import {Translate, useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {type TableRelease} from './ReleasesOverview'

type BulkAction = 'archive' | 'archiveAndDelete'

// Per-action copy + tone, so one confirm dialog serves both. Archive is reversible (unarchive).
// Archive-and-delete is the destructive bulk action in this view: an active release can't be
// deleted directly (it would wreck an in-flight campaign) — the delete API only accepts
// archived/published releases — so the bulk action archives first, then deletes. Plain delete is
// reserved for the archived-releases view, which has no bulk selection today. Duplicate/Schedule
// are intentionally NOT bulk actions: duplicate needs each release's documents (a per-release
// fetch, not loopable over a selection), and scheduling many to one time collides (releases
// publish one at a time) — both stay in the per-row menu.
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
    noneEligibleKey: string
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
    noneEligibleKey: 'overview.bulk.archive-none-eligible',
  },
  archiveAndDelete: {
    icon: TrashIcon,
    tone: 'critical',
    labelKey: 'overview.bulk.archive-and-delete',
    testId: 'release-overview-bulk-archive-and-delete',
    headerKey: 'overview.bulk.archive-and-delete-dialog.header',
    confirmKey: 'overview.bulk.archive-and-delete-dialog.confirm',
    descriptionKey: 'overview.bulk.archive-and-delete-dialog.description',
    toastSuccessKey: 'overview.bulk.archive-and-delete-toast.success',
    toastErrorKey: 'overview.bulk.archive-and-delete-toast.error',
    confirmTone: 'critical',
    noneEligibleKey: 'overview.bulk.archive-and-delete-none-eligible',
  },
}

// Both bulk actions share the same eligibility rule: a release can only be archived (or
// archived-and-deleted) while it isn't scheduled/scheduling — mirrors the per-row rule in
// ReleaseMenu.tsx (a scheduled release must be unscheduled first).
const isEligible = (release: TableRelease): boolean => release.state === 'active'

/**
 * Bulk-action toolbar contents for the releases overview, rendered inside the DocumentTable command
 * lane when a selection exists. Mirrors the detail-page bulk toolbar (ghost buttons when wide, an
 * overflow menu when compact). Ships Archive (reversible) + Archive and delete (permanent,
 * critical-toned: archives then deletes, since an active release can't be deleted directly). Both
 * only apply to releases in the `active` state — scheduled/scheduling releases are skipped, with a
 * note in the confirm dialog. Each action opens a confirmation before running.
 */
export function ReleaseBulkActions({
  selectedReleases,
  compact,
  onClear,
}: {
  selectedReleases: TableRelease[]
  compact: boolean
  onClear: () => void
}): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {archive, deleteRelease} = useReleaseOperations()
  const toast = useToast()
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const count = selectedReleases.length

  const eligibleReleases = useMemo(() => selectedReleases.filter(isEligible), [selectedReleases])
  const eligibleIds = useMemo(
    () => eligibleReleases.map((release) => release._id),
    [eligibleReleases],
  )
  const eligibleCount = eligibleIds.length
  const skippedCount = count - eligibleCount

  const runAction = useCallback(async () => {
    if (!pendingAction) return
    const config = ACTION_CONFIG[pendingAction]

    setIsRunning(true)
    const results = await Promise.allSettled(
      eligibleIds.map(async (id) => {
        if (pendingAction === 'archiveAndDelete') {
          await archive(id)
          await deleteRelease(id)
          return
        }
        await archive(id)
      }),
    )
    const failed = results.filter((result) => result.status === 'rejected').length
    const succeeded = eligibleIds.length - failed

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
  }, [archive, deleteRelease, eligibleIds, onClear, pendingAction, t, toast])

  const archiveConfig = ACTION_CONFIG.archive
  const archiveAndDeleteConfig = ACTION_CONFIG.archiveAndDelete
  const actionsDisabled = eligibleCount === 0
  const archiveTooltipContent = actionsDisabled ? t(archiveConfig.noneEligibleKey) : undefined
  const archiveAndDeleteTooltipContent = actionsDisabled
    ? t(archiveAndDeleteConfig.noneEligibleKey)
    : undefined

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
            disabled={actionsDisabled}
            tooltipProps={{content: archiveTooltipContent, disabled: !actionsDisabled}}
          />
          <MenuItem
            data-testid={archiveAndDeleteConfig.testId}
            icon={archiveAndDeleteConfig.icon}
            onClick={() => setPendingAction('archiveAndDelete')}
            text={t(archiveAndDeleteConfig.labelKey)}
            tone="critical"
            disabled={actionsDisabled}
            tooltipProps={{content: archiveAndDeleteTooltipContent, disabled: !actionsDisabled}}
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
        disabled={actionsDisabled}
        tooltipProps={{content: archiveTooltipContent, disabled: !actionsDisabled}}
      />
      <Button
        data-testid={archiveAndDeleteConfig.testId}
        icon={archiveAndDeleteConfig.icon}
        mode="ghost"
        onClick={() => setPendingAction('archiveAndDelete')}
        text={t(archiveAndDeleteConfig.labelKey)}
        tone="critical"
        disabled={actionsDisabled}
        tooltipProps={{content: archiveAndDeleteTooltipContent, disabled: !actionsDisabled}}
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
                values={{count: eligibleCount}}
              />
            </Text>
            {skippedCount > 0 && (
              <Text muted size={1}>
                <Translate
                  t={t}
                  i18nKey="overview.bulk.archive-skipped-note"
                  values={{count: skippedCount}}
                />
              </Text>
            )}
          </Stack>
        </Dialog>
      )}
    </>
  )
}
