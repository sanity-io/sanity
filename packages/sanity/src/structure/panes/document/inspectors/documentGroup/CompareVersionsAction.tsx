import {useTranslation} from 'sanity'

import {useDocumentIdStack} from '../../../../../core/hooks/useDocumentIdStack'
import {Button} from '../../../../../ui-components/button/Button'
import {structureLocaleNamespace} from '../../../../i18n'
import {getCompareVersionsItem} from '../../menuItems'
import {useDocumentPane} from '../../useDocumentPane'

/**
 * Shortcut to the document pane's "Compare versions" menu item, rendered in the document group
 * inventory header as an icon button labelled by the menu item's title. It dispatches the menu item
 * itself, so the pane opens the same comparison.
 *
 * @internal
 */
export function CompareVersionsAction() {
  const {displayed, documentId, editState, onMenuAction} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)
  const documentIdStack = useDocumentIdStack({displayed, documentId, editState})
  const item = getCompareVersionsItem({documentIdStack, t})

  return (
    <Button
      aria-label={item.title}
      data-testid="document-group-inventory-compare-versions"
      disabled={Boolean(item.disabled)}
      icon={item.icon}
      mode="bleed"
      onClick={() => onMenuAction(item)}
      tooltipProps={{content: item.title}}
    />
  )
}
