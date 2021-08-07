// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {MenuItem} from '@sanity/base/__legacy/@sanity/components'
import BinaryIcon from 'part:@sanity/base/binary-icon'
import PublicIcon from 'part:@sanity/base/public-icon'
import HistoryIcon from 'part:@sanity/base/history-icon'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'
import React from 'react'
import {DeskToolFeatures} from '../../../../features'

import styles from './menuItems.css'

interface Params {
  features: DeskToolFeatures
  isHistoryOpen: boolean
  hasValue: boolean
  previewUrl: string | null
}

const getHistoryMenuItem = (params: Params): MenuItem | null => {
  const {features, hasValue, isHistoryOpen} = params

  if (!features.reviewChanges) return null

  return {
    action: 'reviewChanges',
    title: 'Review changes',
    icon: HistoryIcon,
    isDisabled: isHistoryOpen || !hasValue,
  }
}

const getInspectItem = ({hasValue}: Params): MenuItem => ({
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
  isDisabled: !hasValue,
})

export const getProductionPreviewItem = ({previewUrl}: Params): MenuItem | null => {
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
    url: previewUrl,
  }
}

export const getMenuItems = (params: Params): MenuItem[] => {
  const items = [getProductionPreviewItem, getHistoryMenuItem, getInspectItem]
    .filter(Boolean)
    .map((fn) => fn(params))

  return items.filter((i) => i !== null) as MenuItem[]
}
