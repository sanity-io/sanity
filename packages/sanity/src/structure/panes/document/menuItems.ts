import {EarthAmericasIcon, JsonIcon, LinkIcon, TransferIcon} from '@sanity/icons'
import {type DocumentInspector, type DocumentInspectorMenuItem, type TFunction} from 'sanity'

import {type DocumentIdStack} from '../../hooks/useDocumentIdStack'
import {type PaneMenuItem, type StructureToolFeatures} from '../../types'
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

function getCompareVersionsItem({documentIdStack, t}: GetMenuItemsParams): PaneMenuItem | null {
  const isDisabled = typeof documentIdStack?.previousId === 'undefined'

  // TODO: It would be preferable to display the option in an inert state, but the `isDisabled`
  // property does not appear to have any impact. Instead, we simply exclude the option when
  // there is no version to compare.
  if (isDisabled) {
    return null
  }

  return {
    action: 'compareVersions',
    group: 'inspectors',
    title: t('compare-versions.menu-item.title'),
    icon: TransferIcon,
    isDisabled,
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
  ].filter(Boolean) as PaneMenuItem[]

  return [
    // Always present document menu item to copy current url to clipboard
    {
      action: 'copy-document-url',
      showAsAction: true,
      title: params.t('action.copy-document-url.label'),
      icon: LinkIcon,
    },
    ...inspectorItems,

    // TODO: convert to inspector or document view?
    getInspectItem(params),

    ...items,
  ]
}
