import {JsonIcon, EarthAmericasIcon} from '@sanity/icons'
import type {DeskToolFeatures, PaneMenuItem} from '../../types'
import {INSPECT_ACTION_PREFIX} from './constants'
import type {DocumentInspector, DocumentInspectorMenuItem, TFunction} from 'sanity'

interface GetMenuItemsParams {
  currentInspector?: DocumentInspector
  features: DeskToolFeatures
  hasValue: boolean
  inspectors: DocumentInspector[]
  previewUrl?: string | null
  inspectorMenuItems: DocumentInspectorMenuItem[]
  t: TFunction
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
        isDisabled: !hasValue,
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
    isDisabled: !hasValue,
    shortcut: 'Ctrl+Alt+I',
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
  ].filter(Boolean) as PaneMenuItem[]

  return [
    ...inspectorItems,

    // TODO: convert to inspector or document view?
    getInspectItem(params),

    ...items,
  ]
}
