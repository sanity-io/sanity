import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {EarthAmericasIcon} from '@sanity/icons/EarthAmericas'
import {JsonIcon} from '@sanity/icons/Json'
import {TransferIcon} from '@sanity/icons/Transfer'
import {
  type DocumentIdStack,
  type DocumentInspector,
  type DocumentInspectorMenuItem,
  type TFunction,
} from 'sanity'

import {type PaneMenuItem, type StructureToolFeatures} from '../../types'
import {HiddenCheckmarkIcon} from './components/HiddenCheckmarkIcon'
import {INSPECT_ACTION_PREFIX} from './constants'

interface GetMenuItemsParams {
  currentInspector?: DocumentInspector
  features: StructureToolFeatures
  hasValue: boolean
  inspectors: DocumentInspector[]
  previewUrl?: string | null
  documentIdStack?: DocumentIdStack
  /** PROPOSED (open beta): the version Compare versions opens against (see useCompareWithId); it enables the item whenever another version exists. */
  compareWithId?: string
  inspectorMenuItems: DocumentInspectorMenuItem[]
  t: TFunction
  displayInlineChanges: boolean
}

function getInspectorItems({
  currentInspector,
  hasValue,
  inspectors,
  inspectorMenuItems,
}: GetMenuItemsParams): PaneMenuItem[] {
  return inspectors.flatMap((inspector, index): PaneMenuItem[] => {
    const menuItem = inspectorMenuItems[index]

    if (!menuItem || menuItem.hidden) return []

    // The inspector menu item's tone is wider than a pane menu item's; the cast is the one the list had before.
    const item = {
      action: `${INSPECT_ACTION_PREFIX}${inspector.name}`,
      group: menuItem.showAsAction ? undefined : 'inspectors',
      icon: menuItem.icon,
      disabled: !hasValue,
      selected: currentInspector?.name === inspector.name,
      shortcut: menuItem.hotkeys?.join('+'),
      showAsAction: menuItem.showAsAction,
      title: menuItem.title,
      tone: menuItem.tone,
    } as PaneMenuItem
    // PROPOSED: a button in the header that is also an entry in the menu (`showInMenu`).
    return menuItem.showAsAction && menuItem.showInMenu
      ? [item, {...item, group: 'inspectors', showAsAction: false}]
      : [item]
  })
}

function getInspectItem({hasValue, t}: GetMenuItemsParams): PaneMenuItem {
  return {
    action: 'inspect',
    group: 'inspectors',
    title: t('document-inspector.menu-item.title'),
    icon: JsonIcon,
    disabled: !hasValue,
    shortcut: 'Ctrl+Alt+I',
  }
}

function getCompareVersionsItem({
  compareWithId,
  documentIdStack,
  t,
}: GetMenuItemsParams): PaneMenuItem | null {
  const disabled = typeof (compareWithId ?? documentIdStack?.previousId) === 'undefined' && {
    reason: t('compare-versions.menu-item.disabled-reason'),
  }

  return {
    action: 'compareVersions',
    group: 'inspectors',
    title: t('compare-versions.menu-item.title'),
    icon: TransferIcon,
    disabled,
  }
}

function getInlineChangesItem({displayInlineChanges, t}: GetMenuItemsParams): PaneMenuItem {
  return {
    action: 'toggleInlineChanges',
    group: 'inspectors',
    title: t('toggle-inline-changes.menu-item.title'),
    // The simplest way to render no icon, while preserving an icon-sized space, is to render a
    // hidden icon.
    icon: displayInlineChanges ? CheckmarkIcon : HiddenCheckmarkIcon,
  }
}

function getProductionPreviewItem({previewUrl, t}: GetMenuItemsParams): PaneMenuItem | null {
  if (!previewUrl) return null

  return {
    action: 'production-preview',
    group: 'links',
    title: t('production-preview.menu-item.title'),
    icon: EarthAmericasIcon,
    shortcut: 'Ctrl+Alt+O',
  }
}

export function getMenuItems(params: GetMenuItemsParams): PaneMenuItem[] {
  const inspectorItems = getInspectorItems(params)
  const items = [
    // Get production preview item
    getProductionPreviewItem(params),
    getCompareVersionsItem(params),
    getInlineChangesItem(params),
  ].filter(Boolean) as PaneMenuItem[]

  return [
    ...inspectorItems,

    // TODO: convert to inspector or document view?
    getInspectItem(params),

    ...items,
  ]
}
