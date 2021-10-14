import {MenuItem as MenuItemType} from '@sanity/base/__legacy/@sanity/components'
import {EarthAmericasIcon, BinaryDocumentIcon, RestoreIcon} from '@sanity/icons'
import {DeskToolFeatures} from '../../contexts/deskTool'

interface Params {
  features: DeskToolFeatures
  changesOpen: boolean
  hasValue: boolean
  previewUrl: string | null
}

const getHistoryMenuItem = (params: Params): MenuItemType | null => {
  const {features, hasValue, changesOpen} = params

  if (!features.reviewChanges) return null

  return {
    action: 'reviewChanges',
    title: 'Review changes',
    icon: RestoreIcon,
    isDisabled: changesOpen || !hasValue,
  }
}

const getInspectItem = ({hasValue}: Params): MenuItemType => ({
  action: 'inspect',
  title: 'Inspect',
  icon: BinaryDocumentIcon,
  isDisabled: !hasValue,
  shortcut: 'Ctrl+Alt+I',
})

export const getProductionPreviewItem = ({previewUrl}: Params): MenuItemType | null => {
  if (!previewUrl) {
    return null
  }

  return {
    action: 'production-preview',
    title: 'Open preview',
    icon: EarthAmericasIcon,
    url: previewUrl,
    shortcut: 'Ctrl+Alt+O',
  }
}

export const getMenuItems = (params: Params): MenuItemType[] => {
  const items = [getProductionPreviewItem, getHistoryMenuItem, getInspectItem]
    .filter(Boolean)
    .map((fn) => fn(params))

  return items.filter((i) => i !== null) as MenuItemType[]
}
