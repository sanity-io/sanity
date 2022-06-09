import {EarthAmericasIcon, BinaryDocumentIcon, RestoreIcon} from '@sanity/icons'
import {DeskToolFeatures, PaneMenuItem} from '../../types'

interface Params {
  features: DeskToolFeatures
  changesOpen: boolean
  hasValue: boolean
  previewUrl?: string | null
}

const getHistoryMenuItem = (params: Params): PaneMenuItem | null => {
  const {features, hasValue, changesOpen} = params

  if (!features.reviewChanges) return null

  return {
    action: 'reviewChanges',
    title: 'Review changes',
    icon: RestoreIcon,
    isDisabled: changesOpen || !hasValue,
  }
}

const getInspectItem = ({hasValue}: Params): PaneMenuItem => ({
  action: 'inspect',
  title: 'Inspect',
  icon: BinaryDocumentIcon,
  isDisabled: !hasValue,
  shortcut: 'Ctrl+Alt+I',
})

export const getProductionPreviewItem = ({previewUrl}: Params): PaneMenuItem | null => {
  if (!previewUrl) return null

  return {
    action: 'production-preview',
    title: 'Open preview',
    icon: EarthAmericasIcon,
    shortcut: 'Ctrl+Alt+O',
  }
}

export const getMenuItems = (params: Params): PaneMenuItem[] => {
  const items = [getProductionPreviewItem, getHistoryMenuItem, getInspectItem]
    .filter(Boolean)
    .map((fn) => fn(params))

  return items.filter((i) => i !== null) as PaneMenuItem[]
}
