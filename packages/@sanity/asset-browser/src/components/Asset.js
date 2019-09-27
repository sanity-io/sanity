import React, {useCallback, useContext} from 'react'
import idx from 'idx'
import AssetBrowserContextDispatch from 'part:@sanity/asset-browser/context/dispatch'
import Spinner from 'part:@sanity/components/loading/spinner'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import TrashIcon from 'part:@sanity/base/trash-icon'
import LinkIcon from 'part:@sanity/base/link-icon'
import MoreVertIcon from 'part:@sanity/base/more-vert-icon'
import {itemType} from '../../types'
import styles from './styles/Asset.css'

const MENU_ITEMS = [
  {
    name: 'showRefs',
    title: 'Show documents using this',
    icon: LinkIcon
  },
  {
    name: 'delete',
    title: 'Delete',
    color: 'danger',
    icon: TrashIcon
  }
]

const renderMenuItem = item => {
  const {color, title, icon} = item
  const Icon = icon
  return (
    <div className={color === 'danger' ? styles.menuItemDanger : styles.menuItem}>
      {icon && <Icon />}&nbsp;&nbsp;{title}
    </div>
  )
}

// eslint-disable-next-line react/no-multi-comp
const Asset = props => {
  const {
    item: {asset, updating}
  } = props

  const {onDelete, onDialogShowRefs, onSelect} = useContext(AssetBrowserContextDispatch)

  const handleImageClick = useCallback(event => {
    event.preventDefault()
    if (onSelect) {
      onSelect(asset)
    }
  }, [])

  const handleKeyPress = useCallback(event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (onSelect) {
        onSelect(asset)
      }
    }
  }, [])

  const handleMenuAction = useCallback(action => {
    switch (action.name) {
      case 'delete':
        onDelete(asset, 'dialog')
        break
      case 'showRefs':
        onDialogShowRefs(asset)
        break
      default:
        break
    }
  }, [])

  const size = 75
  const dpi =
    typeof window === 'undefined' || !window.devicePixelRatio
      ? 1
      : Math.round(window.devicePixelRatio)
  const imgH = 100 * Math.max(1, dpi)
  const width = idx(asset, _ => _.metadata.dimensions.width) || 100
  const height = idx(asset, _ => _.metadata.dimensions.height) || 100

  return (
    <a
      className={styles.item}
      onKeyPress={handleKeyPress}
      style={{
        width: `${(width * size) / height}px`,
        flexGrow: (width * size) / height
      }}
      tabIndex={0}
    >
      <i className={styles.padder} style={{paddingBottom: `${(height / width) * 100}%`}} />
      <img
        className={styles.image}
        data-id={asset._id}
        onClick={handleImageClick}
        src={`${asset.url}?h=${imgH}&fit=max`}
      />

      <div className={styles.menuContainer}>
        <DropDownButton
          items={MENU_ITEMS}
          onAction={handleMenuAction}
          placement="bottom-end"
          renderItem={renderMenuItem}
          showArrow={false}
        >
          <MoreVertIcon />
        </DropDownButton>
      </div>

      {updating && (
        <div className={styles.spinnerContainer}>
          <Spinner center />
        </div>
      )}
    </a>
  )
}

Asset.propTypes = {
  item: itemType.isRequired
}

export default React.memo(Asset)
