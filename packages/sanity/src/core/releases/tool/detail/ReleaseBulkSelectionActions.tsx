import {CloseIcon} from '@sanity/icons/Close'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Flex, Menu} from '@sanity/ui'
import {useMemo} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../../i18n'
import {useAnyDocumentInReleaseHasPairPermission} from './releaseBulkDocumentPermissions'
import {isDocumentEligibleForUnpublish} from './releaseDocumentActions'
import {type DocumentInReleaseDetail} from './ReleaseSummary'

/**
 * Bulk discard / unpublish controls for the release document table selection bar.
 *
 * @internal
 */
export function ReleaseBulkSelectionActions({
  selectedKeys,
  filterTabRows,
  compact,
  onDiscard,
  onUnpublish,
}: {
  selectedKeys: string[]
  filterTabRows: DocumentInReleaseDetail[]
  compact: boolean
  onDiscard: () => void
  onUnpublish: () => void
}): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)

  const selectedRows = useMemo(() => {
    const byId = new Map(filterTabRows.map((row) => [row.document._id, row]))
    return selectedKeys
      .map((key) => byId.get(key))
      .filter((row): row is DocumentInReleaseDetail => Boolean(row))
  }, [filterTabRows, selectedKeys])

  const hasUnpublishEligibleSelection = selectedRows.some(isDocumentEligibleForUnpublish)

  const {granted: canDiscardSelection, isLoading: isDiscardPermissionsLoading} =
    useAnyDocumentInReleaseHasPairPermission(selectedRows, 'discardVersion')

  const {granted: canUnpublishSelection, isLoading: isUnpublishPermissionsLoading} =
    useAnyDocumentInReleaseHasPairPermission(selectedRows, 'unpublish')

  const isDiscardDisabled = !canDiscardSelection || isDiscardPermissionsLoading
  const discardTooltip = t('permissions.error.discard-version')

  const isUnpublishDisabled =
    !hasUnpublishEligibleSelection || !canUnpublishSelection || isUnpublishPermissionsLoading

  const unpublishTooltip = useMemo(() => {
    if (!canUnpublishSelection || isUnpublishPermissionsLoading) {
      return t('permissions.error.unpublish')
    }
    if (!hasUnpublishEligibleSelection) {
      return t('unpublish.no-published-version')
    }
    return null
  }, [canUnpublishSelection, hasUnpublishEligibleSelection, isUnpublishPermissionsLoading, t])

  if (compact) {
    return (
      <MenuButton
        id="release-bulk-more"
        button={
          <Button
            data-testid="release-bulk-more"
            icon={EllipsisHorizontalIcon}
            mode="bleed"
            tooltipProps={{content: t('dashboard.details.bulk.more')}}
          />
        }
        menu={
          <Menu>
            <MenuItem
              data-testid="release-bulk-discard"
              disabled={isDiscardDisabled}
              icon={CloseIcon}
              onClick={onDiscard}
              text={t('dashboard.details.bulk.discard')}
              tone="critical"
              tooltipProps={{
                disabled: !isDiscardDisabled,
                content: discardTooltip,
              }}
            />
            <MenuItem
              data-testid="release-bulk-unpublish"
              disabled={isUnpublishDisabled}
              icon={UnpublishIcon}
              onClick={onUnpublish}
              text={t('dashboard.details.bulk.unpublish')}
              tooltipProps={{
                disabled: !isUnpublishDisabled,
                content: unpublishTooltip,
              }}
            />
          </Menu>
        }
        popover={{placement: 'bottom-end', portal: true}}
      />
    )
  }

  return (
    <Flex align="center" flex="none" gap={2}>
      <Button
        data-testid="release-bulk-discard"
        disabled={isDiscardDisabled}
        icon={CloseIcon}
        mode="ghost"
        onClick={onDiscard}
        text={t('dashboard.details.bulk.discard')}
        tone="critical"
        tooltipProps={{
          disabled: !isDiscardDisabled,
          content: discardTooltip,
        }}
      />
      <Button
        data-testid="release-bulk-unpublish"
        disabled={isUnpublishDisabled}
        icon={UnpublishIcon}
        mode="ghost"
        onClick={onUnpublish}
        text={t('dashboard.details.bulk.unpublish')}
        tooltipProps={{
          disabled: !isUnpublishDisabled,
          content: unpublishTooltip,
        }}
      />
    </Flex>
  )
}
