import {useTranslation} from 'sanity'

import {Button} from '../../../../../ui-components/button/Button'
import {useDocumentGroupInspectorState} from '../../inspectors/documentGroup/useDocumentGroupInspectorState'
import {useDocumentPane} from '../../useDocumentPane'

/**
 * Toggles the document group inspector, which hosts the document group inventory.
 *
 * @internal
 */
export function DocumentGroupInventoryButton() {
  const {t} = useTranslation()
  const {inspector, openInspector, closeInspector} = useDocumentPane()

  const {isDocumentGroupInventoryActive, setIsDocumentGroupInventoryActive} =
    useDocumentGroupInspectorState({
      currentInspector: inspector ?? undefined,
      openInspector,
      closeInspector,
    })

  return (
    <Button
      data-testid="action-document-group-inventory"
      mode="ghost"
      onClick={() => setIsDocumentGroupInventoryActive(!isDocumentGroupInventoryActive)}
      selected={isDocumentGroupInventoryActive}
      text={t('document-group-inventory.action.manage-versions')}
      tone="suggest"
    />
  )
}
