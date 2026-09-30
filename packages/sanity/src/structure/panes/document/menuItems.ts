import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {EarthAmericasIcon} from '@sanity/icons/EarthAmericas'
import {JsonIcon} from '@sanity/icons/Json'
import {TransferIcon} from '@sanity/icons/Transfer'
import {
  type DocumentIdStack,
  type DocumentInspector,
  type DocumentInspectorMenuItem,
  type ResolvedDocumentTools,
  type TFunction,
} from 'sanity'

import {type PaneMenuItem} from '../../types'
import {HiddenCheckmarkIcon} from './components/HiddenCheckmarkIcon'
import {INSPECT_ACTION_PREFIX} from './constants'

interface GetMenuItemsParams {
  currentInspector?: DocumentInspector
  tools: ResolvedDocumentTools
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
  return inspectors.flatMap((inspector, index) => {
    const menuItem = inspectorMenuItems[index]

    if (!menuItem || menuItem.hidden) return []

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
}

function getInspectItem({tools, hasValue, t}: GetMenuItemsParams): PaneMenuItem | null {
  const tool = tools.byId.get('inspect')

  if (!tool) return null

  return {
    action: 'inspect',
    group: 'inspectors',
    title: t('document-inspector.menu-item.title'),
    icon: JsonIcon,
    disabled: !hasValue,
    shortcut: tool.shortcut,
  }
}

function getCompareVersionsItem({
  tools,
  documentIdStack,
  t,
}: GetMenuItemsParams): PaneMenuItem | null {
  const tool = tools.byId.get('compareVersions')

  if (!tool) return null

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

function getInlineChangesItem({
  tools,
  displayInlineChanges,
  t,
}: GetMenuItemsParams): PaneMenuItem | null {
  const tool = tools.byId.get('inlineChanges')

  if (!tool) return null

  return {
    action: 'toggleInlineChanges',
    group: 'inspectors',
    title: t('toggle-inline-changes.menu-item.title'),
    // The simplest way to render no icon, while preserving an icon-sized space, is to render a
    // hidden icon.
    icon: displayInlineChanges ? CheckmarkIcon : HiddenCheckmarkIcon,
  }
}

function getProductionPreviewItem({tools, previewUrl, t}: GetMenuItemsParams): PaneMenuItem | null {
  if (!previewUrl) return null

  const tool = tools.byId.get('productionPreview')

  if (!tool) return null

  return {
    action: 'production-preview',
    group: 'links',
    title: t('production-preview.menu-item.title'),
    icon: EarthAmericasIcon,
    shortcut: tool.shortcut,
  }
}

export function getMenuItems(params: GetMenuItemsParams): PaneMenuItem[] {
  const items = [
    // TODO: convert to inspector or document view?
    getInspectItem(params),
    getProductionPreviewItem(params),
    getCompareVersionsItem(params),
    getInlineChangesItem(params),
  ].filter((item) => item !== null)

  return [...getInspectorItems(params), ...items]
}
