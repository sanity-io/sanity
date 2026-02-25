import {CheckmarkIcon, EarthAmericasIcon, JsonIcon, TransferIcon} from '@sanity/icons'
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
  return inspectors
    .map((inspector, index) => {
      const menuItem = inspectorMenuItems[index]

      if (!menuItem || menuItem.hidden) return null

      return {
        action: `${INSPECT_ACTION_PREFIX}${inspector.name}`,
        group: menuItem.showAsAction ? undefined : 'inspectors',
        icon: menuItem.icon,
        disabled: !hasValue,
        selected: currentInspector?.name === inspector.name,
        shortcut: menuItem.hotkeys?.join('+'),
        showAsAction: menuItem.showAsAction,
        title: menuItem.title,
        tone: menuItem.tone,
      }
    })
    .filter(Boolean) as PaneMenuItem[]
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

function getCompareVersionsItem({documentIdStack, t}: GetMenuItemsParams): PaneMenuItem | null {
  const disabled = typeof documentIdStack?.previousId === 'undefined' && {
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

export function getProductionPreviewItem({previewUrl, t}: GetMenuItemsParams): PaneMenuItem | null {
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
