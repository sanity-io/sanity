import {TrashIcon} from '@sanity/icons'
import {isKeySegment, type KeyedSegment, type Path} from '@sanity/types'
import {Menu} from '@sanity/ui'
import {useCallback} from 'react'

import {MenuButton} from '../../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../../ui-components/menuItem/MenuItem'
import {ContextMenuButton} from '../../../../../components/contextMenuButton/ContextMenuButton'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {PatchEvent, unset} from '../../../../patch'
import {type FormPatch} from '../../../../patch/types'

export function NestedDialogActions({
  relativePath,
  rootOnChange,
  readOnly,
  onHandlePathSelect,
}: {
  relativePath: Path
  rootOnChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  readOnly: boolean
  onHandlePathSelect: (path: Path) => void
}) {
  const {t} = useTranslation()

  const handleRemove = useCallback(() => {
    if (!rootOnChange || !isKeySegment(relativePath[relativePath.length - 1])) return

    const currentItemKey = (relativePath[relativePath.length - 1] as KeyedSegment)._key
    const parentArrayPath = relativePath.slice(0, -1)

    // Create an unset patch for the array item
    let patch = PatchEvent.from([unset([{_key: currentItemKey}])])

    // Prefix the patch with the parent array path (in reverse order)
    // This gives the patch the full context of where the item is located
    for (let i = parentArrayPath.length - 1; i >= 0; i--) {
      patch = patch.prefixAll(parentArrayPath[i])
    }

    rootOnChange(patch)

    // Navigate back to the parent or, if there is only one key, closes the dialog
    const parentKeyPath = relativePath.slice(0, -2)
    onHandlePathSelect(parentKeyPath)
  }, [onHandlePathSelect, relativePath, rootOnChange])

  // Remove actions, this matches the behavior of the array items component
  if (readOnly) return null

  return (
    <MenuButton
      menu={
        <Menu>
          <MenuItem
            text={t('inputs.array.action.remove')}
            tone="critical"
            icon={TrashIcon}
            onClick={handleRemove}
            disabled={readOnly}
          />
        </Menu>
      }
      id={'nested-dialog-actions-menu-button'}
      button={<ContextMenuButton />}
    />
  )
}
