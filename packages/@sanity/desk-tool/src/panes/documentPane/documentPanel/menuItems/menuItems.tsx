import React from 'react'
import BinaryIcon from 'part:@sanity/base/binary-icon'
import PublicIcon from 'part:@sanity/base/public-icon'
import HistoryIcon from 'part:@sanity/base/history-icon'
import {MenuItemType} from 'part:@sanity/components/menus/default'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'
import resolveProductionPreviewUrl from 'part:@sanity/transitional/production-preview/resolve-production-url?'
import {DeskToolFeatures} from '../../../../features'
import {Doc} from '../../types'

import styles from './menuItems.css'

interface Params {
  canShowHistoryList?: boolean
  features: DeskToolFeatures
  isHistoryOpen?: boolean
  isHistoryEnabled?: boolean
  isLiveEditEnabled?: boolean
  rev: string | null
  value: Doc | null
}

const getHistoryMenuItem = (params: Params): MenuItemType | null => {
  const {
    features,
    value,
    isLiveEditEnabled,
    isHistoryEnabled,
    isHistoryOpen,
    canShowHistoryList
  } = params

  if (isLiveEditEnabled || !canShowHistoryList) {
    return null
  }

  if (isHistoryEnabled) {
    return {
      action: 'reviewChanges',
      title: 'Review changes',
      icon: HistoryIcon,
      isDisabled: !features.reviewChanges || isHistoryOpen || !value
    }
  }

  return null
}

const getInspectItem = ({value}: Params): MenuItemType => ({
  action: 'inspect',
  title: (
    <span className={styles.menuItem}>
      <span className={styles.menuItemLabel}>Inspect</span>
      <span className={styles.hotkey}>
        <Hotkeys keys={['Ctrl', 'Alt', 'I']} size="small" />
      </span>
    </span>
  ),
  icon: BinaryIcon,
  isDisabled: !value
})

export const getProductionPreviewItem = ({value, rev}: Params): MenuItemType | null => {
  if (!value || !resolveProductionPreviewUrl) {
    return null
  }

  let previewUrl: string

  try {
    previewUrl = resolveProductionPreviewUrl(value, rev)
  } catch (error) {
    error.message = `An error was thrown while trying to get production preview url: ${error.message}`
    // eslint-disable-next-line no-console
    console.error(error)
    return null
  }

  if (!previewUrl) {
    return null
  }

  return {
    action: 'production-preview',
    title: (
      <span className={styles.menuItem}>
        <span className={styles.menuItemLabel}>Open preview</span>
        <span className={styles.hotkey}>
          <Hotkeys keys={['Ctrl', 'Alt', 'O']} size="small" />
        </span>
      </span>
    ),
    icon: PublicIcon,
    url: previewUrl
  }
}

export const getMenuItems = (params: Params): MenuItemType[] => {
  const items = [getProductionPreviewItem, getHistoryMenuItem, getInspectItem]
    .filter(Boolean)
    .map(fn => fn(params))

  return items.filter(i => i !== null) as MenuItemType[]
}
