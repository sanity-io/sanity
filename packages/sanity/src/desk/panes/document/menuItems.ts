import {BinaryDocumentIcon, EarthAmericasIcon, RestoreIcon} from '@sanity/icons'
import {DeskToolFeatures, PaneMenuItem} from '../../types'
import {INSPECT_ACTION_PREFIX} from './constants'
import {DocumentInspector, DocumentInspectorMenuItem, ValidationMarker, isRecord} from 'sanity'

interface GetMenuItemsParams {
  changesOpen: boolean
  currentInspector?: DocumentInspector
  features: DeskToolFeatures
  hasValue: boolean
  inspectors: DocumentInspector[]
  previewUrl?: string | null
  validation: ValidationMarker[]
}

function getInspectorItems({
  currentInspector,
  hasValue,
  inspectors,
  validation,
}: GetMenuItemsParams): PaneMenuItem[] {
  return inspectors
    .map((inspector) => {
      let menuItem: DocumentInspectorMenuItem | undefined

      if (typeof inspector.menuItem === 'function') {
        menuItem = inspector.menuItem({validation})
      } else if (isRecord(inspector.menuItem)) {
        menuItem = inspector.menuItem
      }

      if (menuItem?.hidden) return null

      return {
        action: `${INSPECT_ACTION_PREFIX}${inspector.name}`,
        group: 'inspectors',
        title: menuItem?.title,
        icon: menuItem?.icon,
        isDisabled: !hasValue,
        selected: currentInspector?.name === inspector.name,
        shortcut: menuItem?.hotkeys?.join('+'),
        showAsAction: inspector.showAsAction,
        tone: menuItem?.tone,
      }
    })
    .filter(Boolean) as PaneMenuItem[]
}

function getInspectItem({hasValue}: GetMenuItemsParams): PaneMenuItem {
  return {
    action: 'inspect',
    group: 'inspectors',
    title: 'Inspect',
    icon: BinaryDocumentIcon,
    isDisabled: !hasValue,
    shortcut: 'Ctrl+Alt+I',
  }
}

export function getProductionPreviewItem({previewUrl}: GetMenuItemsParams): PaneMenuItem | null {
  if (!previewUrl) return null

  return {
    action: 'production-preview',
    group: 'links',
    title: 'Open preview',
    icon: EarthAmericasIcon,
    shortcut: 'Ctrl+Alt+O',
  }
}

export function getMenuItems(params: GetMenuItemsParams): PaneMenuItem[] {
  const inspectorItems = getInspectorItems(params).slice(0)
  const items = [
    // Get production preview item
    getProductionPreviewItem(params),
  ].filter(Boolean) as PaneMenuItem[]

  return [
    ...inspectorItems,

    // TODO: convert to inspector
    ...(params.features.resizablePanes
      ? [
          {
            action: 'reviewChanges',
            group: 'inspectors',
            title: 'Review changes',
            icon: RestoreIcon,
            isDisabled: params.changesOpen || !params.hasValue,
          },
        ]
      : []),

    // TODO: convert to inspector or document view?
    getInspectItem(params),

    ...items,
  ]
}
