import React from 'react'
import PublicIcon from 'part:@sanity/base/public-icon'
import BinaryIcon from 'part:@sanity/base/binary-icon'

import HistoryIcon from 'part:@sanity/base/history-icon'
import resolveProductionPreviewUrl from 'part:@sanity/transitional/production-preview/resolve-production-url?'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'
import {historyIsEnabled} from './editor/history'
import styles from './documentPaneMenuItems.css'

const getHistoryMenuItem = ({value, isLiveEditEnabled, isHistoryEnabled, canShowHistoryList}) => {
  if (isLiveEditEnabled || !canShowHistoryList) {
    return null
  }

  if (historyIsEnabled()) {
    return {
      action: 'browseHistory',
      title: 'Browse history',
      icon: HistoryIcon,
      isDisabled: isHistoryEnabled || !value
    }
  }
  return null
}

const getInspectItem = ({value}) => ({
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

export const getProductionPreviewItem = ({value, revision}) => {
  if (!value || !resolveProductionPreviewUrl) {
    return null
  }
  let previewUrl
  try {
    previewUrl = resolveProductionPreviewUrl(value, revision)
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

// eslint-disable-next-line import/prefer-default-export
export const getMenuItems = ({
  value,
  isLiveEditEnabled,
  isHistoryEnabled,
  revision,
  canShowHistoryList
}) =>
  [getProductionPreviewItem, getHistoryMenuItem, getInspectItem]
    .filter(Boolean)
    .map(fn => fn({value, isLiveEditEnabled, isHistoryEnabled, revision, canShowHistoryList}))
    .filter(Boolean)
