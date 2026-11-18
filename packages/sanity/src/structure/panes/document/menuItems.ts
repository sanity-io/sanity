import {EarthAmericasIcon} from '@sanity/icons/EarthAmericas'
import {HighlightIcon} from '@sanity/icons/Highlight'
import {JsonIcon} from '@sanity/icons/Json'
import {TransferIcon} from '@sanity/icons/Transfer'
import {
  type DocumentIdStack,
  type DocumentInspector,
  type DocumentInspectorMenuItem,
  type TFunction,
} from 'sanity'

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
  displayInlineChanges: boolean
  /**
   * With the document group inventory, Compare versions opens even when nothing comes before the
   * open version: the view shows it alone and asks for the version to compare with.
   */
  compareWithoutPrevious?: boolean
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

export function getCompareVersionsItem({
  compareWithoutPrevious,
  documentIdStack,
  t,
}: Pick<GetMenuItemsParams, 'compareWithoutPrevious' | 'documentIdStack' | 't'>): PaneMenuItem {
  const disabled = !compareWithoutPrevious &&
    typeof documentIdStack?.previousId === 'undefined' && {
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
    icon: HighlightIcon,
    // On shows as a selected row with a checkmark at its end, like the inspector toggles
    selected: displayInlineChanges,
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
