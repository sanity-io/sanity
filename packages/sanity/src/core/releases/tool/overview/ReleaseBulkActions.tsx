import {ArchiveIcon} from '@sanity/icons/Archive'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnarchiveIcon} from '@sanity/icons/Unarchive'
import {Flex, Menu, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button, Dialog, MenuButton, MenuItem} from '../../../../ui-components'
import {Translate, useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {type Mode} from './queryParamUtils'
import {type TableRelease} from './ReleasesOverview'

type ActiveBulkAction = 'archive' | 'archiveAndDelete'
type ArchivedBulkAction = 'unarchive' | 'delete'
type BulkAction = ActiveBulkAction | ArchivedBulkAction

// Per-action copy + tone, so one confirm dialog serves both actions in a mode. Archive is
// reversible (unarchive). Archive-and-delete is the destructive bulk action in the active view: an
// active release can't be deleted directly (it would wreck an in-flight campaign) — the delete API
// only accepts archived/published releases — so the bulk action archives first, then deletes.
// In the archived view the releases are already archived (or published), so Unarchive and Delete
// both apply directly, mirroring the per-row rules in ReleaseMenu.tsx. Duplicate/Schedule are
// intentionally NOT bulk actions in either mode: duplicate needs each release's documents (a
// per-release fetch, not loopable over a selection), and scheduling many to one time collides
// (releases publish one at a time) — both stay in the per-row menu.
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
    skippedNoteKey: string
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
    skippedNoteKey: 'overview.bulk.archive-skipped-note',
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
    skippedNoteKey: 'overview.bulk.archive-skipped-note',
  },
  unarchive: {
    icon: UnarchiveIcon,
    labelKey: 'overview.bulk.unarchive',
    testId: 'release-overview-bulk-unarchive',
    headerKey: 'overview.bulk.unarchive-dialog.header',
    confirmKey: 'overview.bulk.unarchive-dialog.confirm',
    descriptionKey: 'overview.bulk.unarchive-dialog.description',
    toastSuccessKey: 'overview.bulk.unarchive-toast.success',
    toastErrorKey: 'overview.bulk.unarchive-toast.error',
    confirmTone: 'caution',
    noneEligibleKey: 'overview.bulk.unarchive-none-eligible',
    skippedNoteKey: 'overview.bulk.unarchive-skipped-note',
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
    noneEligibleKey: 'overview.bulk.delete-none-eligible',
    skippedNoteKey: 'overview.bulk.delete-skipped-note',
  },
}

// Which actions are offered, and each action's eligibility rule, depend on the group mode.
// - Active mode: a release can only be archived (or archived-and-deleted) while it isn't
//   scheduled/scheduling — mirrors the per-row rule in ReleaseMenu.tsx (a scheduled release must
//   be unscheduled first).
// - Archived mode: the view holds releases in either the `archived` or `published` state (see
//   ARCHIVED_RELEASE_STATES). Unarchive only makes sense for `archived` releases — a `published`
//   release has nothing to "unarchive" back to (mirrors ReleaseMenu.tsx, which never shows
//   Unarchive for `published`). Delete applies to both, since the delete API accepts either.
const ACTIONS_BY_MODE: Record<Mode, BulkAction[]> = {
  active: ['archive', 'archiveAndDelete'],
  archived: ['unarchive', 'delete'],
  paused: [],
}

const ELIGIBILITY: Record<BulkAction, (release: TableRelease) => boolean> = {
  archive: (release) => release.state === 'active',
  archiveAndDelete: (release) => release.state === 'active',
  unarchive: (release) => release.state === 'archived',
  delete: (release) => release.state === 'archived' || release.state === 'published',
}

/**
 * Bulk-action toolbar contents for the releases overview, rendered inside the DocumentTable command
 * lane when a selection exists. Mirrors the detail-page bulk toolbar (ghost buttons when wide, an
 * overflow menu when compact). The action set depends on the current `mode`:
 * - `active`: Archive (reversible) + Archive and delete (permanent, critical-toned: archives then
 *   deletes, since an active release can't be deleted directly).
 * - `archived`: Unarchive (reversible, only eligible for `archived` releases) + Delete (permanent,
 *   critical-toned, eligible for `archived` or `published` releases — no archive-first needed,
 *   they're already archived/published).
 * Each action is disabled when none of the current selection is eligible for it, with a tooltip
 * explaining why; when only some of the selection is eligible, the confirm dialog notes how many
 * will be skipped. Each action opens a confirmation before running.
 */
export function ReleaseBulkActions({
  selectedReleases,
  mode,
  compact,
  onClear,
}: {
  selectedReleases: TableRelease[]
  mode: Mode
  compact: boolean
  onClear: () => void
}): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {archive, unarchive, deleteRelease} = useReleaseOperations()
  const toast = useToast()
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const count = selectedReleases.length
  const actionsForMode = ACTIONS_BY_MODE[mode]

  const eligibleIdsByAction = useMemo(() => {
    const map: Partial<Record<BulkAction, string[]>> = {}
    for (const action of actionsForMode) {
      map[action] = selectedReleases.filter(ELIGIBILITY[action]).map((release) => release._id)
    }
    return map
  }, [actionsForMode, selectedReleases])

  const runAction = useCallback(async () => {
    if (!pendingAction) return
    const config = ACTION_CONFIG[pendingAction]
    const eligibleIds = eligibleIdsByAction[pendingAction] ?? []

    setIsRunning(true)
    const results = await Promise.allSettled(
      eligibleIds.map(async (id) => {
        if (pendingAction === 'archiveAndDelete') {
          await archive(id)
          await deleteRelease(id)
          return
        }
        if (pendingAction === 'archive') {
          await archive(id)
          return
        }
        if (pendingAction === 'unarchive') {
          await unarchive(id)
          return
        }
        await deleteRelease(id)
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
  }, [archive, deleteRelease, eligibleIdsByAction, onClear, pendingAction, t, toast, unarchive])

  const renderActionButton = useCallback(
    (action: BulkAction) => {
      const config = ACTION_CONFIG[action]
      const eligibleCount = (eligibleIdsByAction[action] ?? []).length
      const disabled = eligibleCount === 0
      const tooltipContent = disabled ? t(config.noneEligibleKey) : undefined

      if (compact) {
        return (
          <MenuItem
            key={action}
            data-testid={config.testId}
            icon={config.icon}
            onClick={() => setPendingAction(action)}
            text={t(config.labelKey)}
            tone={config.tone}
            disabled={disabled}
            tooltipProps={{content: tooltipContent, disabled: !disabled}}
          />
        )
      }

      return (
        <Button
          key={action}
          data-testid={config.testId}
          icon={config.icon}
          mode="ghost"
          onClick={() => setPendingAction(action)}
          text={t(config.labelKey)}
          tone={config.tone}
          disabled={disabled}
          tooltipProps={{content: tooltipContent, disabled: !disabled}}
        />
      )
    },
    [compact, eligibleIdsByAction, t],
  )

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
      menu={<Menu>{actionsForMode.map(renderActionButton)}</Menu>}
      popover={{placement: 'bottom-end', portal: true}}
    />
  ) : (
    <Flex align="center" flex="none" gap={2}>
      {actionsForMode.map(renderActionButton)}
    </Flex>
  )

  const pendingConfig = pendingAction ? ACTION_CONFIG[pendingAction] : undefined
  const pendingEligibleCount = pendingAction ? (eligibleIdsByAction[pendingAction] ?? []).length : 0
  const pendingSkippedCount = pendingAction ? count - pendingEligibleCount : 0

  return (
    <>
      {actions}
      {pendingAction && pendingConfig && (
        <Dialog
          id="release-overview-bulk-action-dialog"
          data-testid="release-overview-bulk-action-dialog"
          header={t(pendingConfig.headerKey)}
          onClose={() => !isRunning && setPendingAction(null)}
          padding={false}
          footer={{
            confirmButton: {
              text: t(pendingConfig.confirmKey),
              tone: pendingConfig.confirmTone,
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
                i18nKey={pendingConfig.descriptionKey}
                values={{count: pendingEligibleCount}}
              />
            </Text>
            {pendingSkippedCount > 0 && (
              <Text muted size={1}>
                <Translate
                  t={t}
                  i18nKey={pendingConfig.skippedNoteKey}
                  values={{count: pendingSkippedCount}}
                />
              </Text>
            )}
          </Stack>
        </Dialog>
      )}
    </>
  )
}
