import {ArchiveIcon} from '@sanity/icons/Archive'
import {CalendarIcon} from '@sanity/icons/Calendar'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {Flex, Menu, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button, Dialog, MenuButton, MenuItem} from '../../../../ui-components'
import {Translate, useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store/useReleaseOperations'

/**
 * Bulk-action toolbar contents for the releases overview, rendered inside the DocumentTable command
 * lane when a selection exists. Mirrors the detail-page bulk toolbar (ghost buttons when wide, an
 * overflow menu when compact). Archive is wired (reversible via unarchive); Schedule is a disabled
 * stub — bulk scheduling to a single time would collide (releases publish one at a time), so it
 * needs a dedicated stagger-aware flow (tracked separately). The per-row ⋯ menu already offers a
 * full action set including per-release scheduling.
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
  const {archive} = useReleaseOperations()
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  const count = selectedIds.length

  const handleConfirmArchive = useCallback(async () => {
    setIsArchiving(true)
    const results = await Promise.allSettled(selectedIds.map((id) => archive(id)))
    const failed = results.filter((result) => result.status === 'rejected').length
    const succeeded = count - failed

    setIsArchiving(false)
    setConfirmOpen(false)

    if (succeeded > 0) {
      toast.push({
        closable: true,
        status: 'success',
        title: (
          <Text muted size={1}>
            {t('overview.bulk.archive-toast.success', {count: succeeded})}
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
            {t('overview.bulk.archive-toast.error')}
          </Text>
        ),
      })
    }
    onClear()
  }, [archive, count, onClear, selectedIds, t, toast])

  const openArchiveConfirm = useCallback(() => setConfirmOpen(true), [])

  const scheduleTooltip = {content: t('overview.bulk.schedule-disabled-tooltip')}

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
            data-testid="release-overview-bulk-schedule"
            disabled
            icon={CalendarIcon}
            text={t('overview.bulk.schedule')}
            tooltipProps={scheduleTooltip}
          />
          <MenuItem
            data-testid="release-overview-bulk-archive"
            icon={ArchiveIcon}
            onClick={openArchiveConfirm}
            text={t('overview.bulk.archive')}
          />
        </Menu>
      }
      popover={{placement: 'bottom-end', portal: true}}
    />
  ) : (
    <Flex align="center" flex="none" gap={2}>
      <Button
        data-testid="release-overview-bulk-schedule"
        disabled
        icon={CalendarIcon}
        mode="ghost"
        text={t('overview.bulk.schedule')}
        tooltipProps={scheduleTooltip}
      />
      <Button
        data-testid="release-overview-bulk-archive"
        icon={ArchiveIcon}
        mode="ghost"
        onClick={openArchiveConfirm}
        text={t('overview.bulk.archive')}
      />
    </Flex>
  )

  return (
    <>
      {actions}
      {confirmOpen && (
        <Dialog
          id="release-overview-bulk-archive-dialog"
          data-testid="release-overview-bulk-archive-dialog"
          header={t('overview.bulk.archive-dialog.header')}
          onClose={() => !isArchiving && setConfirmOpen(false)}
          padding={false}
          footer={{
            confirmButton: {
              text: t('overview.bulk.archive-dialog.confirm'),
              tone: 'caution',
              onClick: handleConfirmArchive,
              loading: isArchiving,
              disabled: isArchiving,
            },
            cancelButton: {
              disabled: isArchiving,
            },
          }}
        >
          <Stack space={4} paddingX={4} paddingY={4}>
            <Text muted size={1}>
              <Translate
                t={t}
                i18nKey="overview.bulk.archive-dialog.description"
                values={{count}}
              />
            </Text>
          </Stack>
        </Dialog>
      )}
    </>
  )
}
