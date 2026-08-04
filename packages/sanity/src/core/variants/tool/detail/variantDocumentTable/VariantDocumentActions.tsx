import {AddIcon} from '@sanity/icons/Add'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Menu, MenuDivider} from '@sanity/ui'
// eslint-disable-next-line @sanity/i18n/no-i18next-import -- types-only import
import {type TFunction} from 'i18next'
import {memo, useCallback} from 'react'

import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {ContextMenuButton} from '../../../../components/contextMenuButton/ContextMenuButton'
import {useSchema} from '../../../../hooks/useSchema'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {type DocumentInVariantGroup} from '../types'
import {type VariantBulkAction} from '../variantBulkActions'

/**
 * Per-row actions for a single document in a variant, opened from a trailing ⋯ button — the same
 * operations the bulk-selection toolbar offers, so a row doesn't have to be selected first. Mirrors
 * the releases document table's per-row menu so the two read as one family.
 *
 * Each action opens the shared confirmation dialog for just this row (via `onAction`), which
 * resolves the document's versions into the concrete per-bundle targets the action will touch —
 * the same disambiguation the bulk toolbar gets. "Add to release" still needs a target-release
 * picker, so it stays disabled (tracked separately).
 *
 * @internal
 */
const VariantDocumentActionsInner = memo(function VariantDocumentActionsInner({
  row,
  t,
  onAction,
}: {
  row: DocumentInVariantGroup
  t: TFunction<'variants'>
  onAction: (action: VariantBulkAction, row: DocumentInVariantGroup) => void
}) {
  const handlePublish = useCallback(() => onAction('publish', row), [onAction, row])
  const handleUnpublish = useCallback(() => onAction('unpublish', row), [onAction, row])
  const handleDelete = useCallback(() => onAction('delete', row), [onAction, row])

  return (
    <MenuButton
      id={`variant-document-actions-${row.groupId}`}
      button={<ContextMenuButton data-testid="variant-document-actions" />}
      menu={
        <Menu>
          <MenuItem
            data-testid="variant-document-publish"
            icon={PublishIcon}
            onClick={handlePublish}
            text={t('detail.documents.bulk.publish')}
            tone="positive"
          />
          <MenuItem disabled icon={AddIcon} text={t('detail.documents.bulk.add-to-release')} />
          <MenuDivider />
          <MenuItem
            data-testid="variant-document-unpublish"
            icon={UnpublishIcon}
            onClick={handleUnpublish}
            text={t('detail.documents.bulk.unpublish')}
          />
          <MenuItem
            data-testid="variant-document-delete"
            icon={TrashIcon}
            onClick={handleDelete}
            text={t('detail.documents.bulk.delete')}
            tone="critical"
          />
        </Menu>
      }
      popover={{placement: 'bottom-end', portal: true}}
    />
  )
})

/**
 * Guards {@link VariantDocumentActionsInner} against an unregistered schema type — the menu's
 * actions assume a resolvable type (e.g. the confirm dialog's row preview reads `schemaType.icon`/
 * `.title`); a document whose type isn't in the current schema gets a disabled button with an
 * explanatory tooltip instead, mirroring the releases document table's `GuardedDocumentActions`.
 *
 * @internal
 */
export const VariantDocumentActions = memo(function VariantDocumentActions(props: {
  row: DocumentInVariantGroup
  t: TFunction<'variants'>
  onAction: (action: VariantBulkAction, row: DocumentInVariantGroup) => void
}) {
  const schema = useSchema()
  const type = schema.get(props.row.document._type)
  const {t: coreT} = useTranslation()
  if (!type) {
    return (
      <ContextMenuButton
        disabled
        tooltipProps={{
          content: coreT('document.type.not-found', {type: props.row.document._type}),
        }}
      />
    )
  }

  return <VariantDocumentActionsInner {...props} />
})
