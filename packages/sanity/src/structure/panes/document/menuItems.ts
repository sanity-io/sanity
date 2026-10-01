import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {EarthAmericasIcon} from '@sanity/icons/EarthAmericas'
import {JsonIcon} from '@sanity/icons/Json'
import {TransferIcon} from '@sanity/icons/Transfer'
import {
  type DocumentIdStack,
  type DocumentInspector,
  type DocumentInspectorMenuItem,
  type ResolvedDocumentFeatures,
  type TFunction,
} from 'sanity'

import {type PaneMenuItem} from '../../types'
import {HiddenCheckmarkIcon} from './components/HiddenCheckmarkIcon'
import {INSPECT_ACTION_PREFIX} from './constants'

interface GetMenuItemsParams {
  currentInspector?: DocumentInspector
  features: ResolvedDocumentFeatures
  hasValue: boolean
  inspectors: DocumentInspector[]
  previewUrl?: string | null
  documentIdStack?: DocumentIdStack
  inspectorMenuItems: (DocumentInspectorMenuItem | undefined)[]
  t: TFunction
  displayInlineChanges: boolean
}

const INSPECT_SHORTCUT = 'Ctrl+Alt+I'
const PRODUCTION_PREVIEW_SHORTCUT = 'Ctrl+Alt+O'

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

function getInspectItem({features, hasValue, t}: GetMenuItemsParams): PaneMenuItem | null {
  if (!features.byName.has('inspect')) return null

  return {
    action: 'inspect',
    group: 'inspectors',
    title: t('document-inspector.menu-item.title'),
    icon: JsonIcon,
    disabled: !hasValue,
    shortcut: INSPECT_SHORTCUT,
  }
}

function getCompareVersionsItem({
  features,
  documentIdStack,
  t,
}: GetMenuItemsParams): PaneMenuItem | null {
  if (!features.byName.has('compareVersions')) return null

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
  features,
  displayInlineChanges,
  t,
}: GetMenuItemsParams): PaneMenuItem | null {
  if (!features.byName.has('inlineChanges')) return null

  return {
    action: 'toggleInlineChanges',
    group: 'inspectors',
    title: t('toggle-inline-changes.menu-item.title'),
    // The simplest way to render no icon, while preserving an icon-sized space, is to render a
    // hidden icon.
    icon: displayInlineChanges ? CheckmarkIcon : HiddenCheckmarkIcon,
  }
}

function getProductionPreviewItem({
  features,
  previewUrl,
  t,
}: GetMenuItemsParams): PaneMenuItem | null {
  if (!previewUrl) return null

  if (!features.byName.has('productionPreview')) return null

  return {
    action: 'production-preview',
    group: 'links',
    title: t('production-preview.menu-item.title'),
    icon: EarthAmericasIcon,
    shortcut: PRODUCTION_PREVIEW_SHORTCUT,
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
