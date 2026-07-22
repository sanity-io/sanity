import {AddIcon} from '@sanity/icons/Add'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Menu, MenuDivider} from '@sanity/ui'
// eslint-disable-next-line @sanity/i18n/no-i18next-import -- types-only import
import {type TFunction} from 'i18next'
import {memo} from 'react'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {type DocumentInVariantGroup} from '../types'

/**
 * Per-row actions for a single document in a variant, opened from a trailing ⋯ button — the same
 * operations the bulk-selection toolbar offers, so a row doesn't have to be selected first. Mirrors
 * the releases document table's per-row menu so the two read as one family.
 *
 * The actions are stubbed (disabled) until the variant document actions are wired up (FH-113),
 * matching the bulk toolbar's current state; wiring one place should light up both.
 *
 * @internal
 */
export const VariantDocumentActions = memo(function VariantDocumentActions({
  row,
  t,
}: {
  row: DocumentInVariantGroup
  t: TFunction<'variants'>
}) {
  return (
    <MenuButton
      id={`variant-document-actions-${row.groupId}`}
      button={<ContextMenuButton data-testid="variant-document-actions" />}
      menu={
        <Menu>
          <MenuItem
            disabled
            icon={PublishIcon}
            text={t('detail.documents.bulk.publish')}
            tone="positive"
          />
          <MenuItem disabled icon={AddIcon} text={t('detail.documents.bulk.add-to-release')} />
          <MenuDivider />
          <MenuItem disabled icon={UnpublishIcon} text={t('detail.documents.bulk.unpublish')} />
          <MenuItem
            data-testid="variant-document-delete"
            disabled
            icon={TrashIcon}
            text={t('detail.documents.bulk.delete')}
            tone="critical"
          />
        </Menu>
      }
      popover={{placement: 'bottom-end', portal: true}}
    />
  )
})
