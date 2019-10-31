import React from 'react'
import TrashIcon from 'part:@sanity/base/trash-icon'
import PublicIcon from 'part:@sanity/base/public-icon'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import BinaryIcon from 'part:@sanity/base/binary-icon'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import HistoryIcon from 'part:@sanity/base/history-icon'
import resolveProductionPreviewUrl from 'part:@sanity/transitional/production-preview/resolve-production-url?'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'
import {historyIsEnabled} from './Editor/history'
import styles from './styles/documentPaneMenuItems.css'

const getDuplicateItem = ({draft, published, isHistoryEnabled}) => ({
  action: 'duplicate',
  title: 'Duplicate',
  icon: ContentCopyIcon,
  isDisabled: isHistoryEnabled || (!draft && !published)
})

const getUnpublishItem = ({published, isLiveEditEnabled, isHistoryEnabled}) =>
  isLiveEditEnabled
    ? null
    : {
        action: 'unpublish',
        title: 'Unpublish…',
        icon: VisibilityOffIcon,
        isDisabled: isHistoryEnabled || !published
      }

const getDeleteItem = ({draft, published, isHistoryEnabled}) => ({
  group: 'danger',
  action: 'delete',
  title: 'Delete…',
  icon: TrashIcon,
  danger: true,
  isDisabled: isHistoryEnabled || (!draft && !published)
})

const getHistoryMenuItem = ({draft, published, isLiveEditEnabled, isHistoryEnabled}) => {
  if (isLiveEditEnabled) {
    return null
  }
  if (historyIsEnabled()) {
    return {
      action: 'browseHistory',
      title: 'Browse history',
      icon: HistoryIcon,
      isDisabled: isHistoryEnabled || !(draft || published)
    }
  }
  return null
}

const getInspectItem = ({draft, published}) => ({
  action: 'inspect',
  title: (
    <span className={styles.menuItem}>
      Inspect{' '}
      <span className={styles.hotkey}>
        <Hotkeys keys={['Ctrl', 'Alt', 'I']} />
      </span>
    </span>
  ),
  icon: BinaryIcon,
  isDisabled: !(draft || published)
})

export const getProductionPreviewItem = ({draft, published, selectedEvent}) => {
  const snapshot = draft || published
  if (!snapshot || !resolveProductionPreviewUrl) {
    return null
  }
  let previewUrl
  try {
    previewUrl = resolveProductionPreviewUrl(snapshot, selectedEvent && selectedEvent.rev)
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
        Open preview
        <span className={styles.hotkey}>
          <Hotkeys keys={['Ctrl', 'Alt', 'O']} />
        </span>
      </span>
    ),
    icon: PublicIcon,
    url: previewUrl
  }
}

// eslint-disable-next-line import/prefer-default-export
export const getMenuItems = ({
  enabledActions,
  draft,
  published,
  isLiveEditEnabled,
  isHistoryEnabled,
  selectedEvent
}) =>
  [
    getProductionPreviewItem,
    enabledActions.includes('delete') && getUnpublishItem,
    enabledActions.includes('create') && getDuplicateItem,
    getHistoryMenuItem,
    getInspectItem,
    enabledActions.includes('delete') && getDeleteItem
  ]
    .filter(Boolean)
    .map(fn => fn({draft, published, isLiveEditEnabled, isHistoryEnabled, selectedEvent}))
    .filter(Boolean)
