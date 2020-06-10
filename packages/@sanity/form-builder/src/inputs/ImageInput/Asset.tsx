import classNames from 'classnames'
import {get} from 'lodash'
import React from 'react'
import client from 'part:@sanity/base/client'
import TrashIcon from 'part:@sanity/base/trash-icon'
import Spinner from 'part:@sanity/components/loading/spinner'
import AssetDialog from './AssetDialog'
import AssetMenu from './AssetMenu'
import {AssetAction, AssetRecord} from './types'

import styles from './Asset.css'

interface AssetProps {
  asset?: AssetRecord
  isSelected: boolean
  onClick?: (...args: any[]) => any
  onKeyPress?: (...args: any[]) => any
  onDeleteFinished: (...args: any[]) => any
}

interface State {
  isDeleting: boolean
  dialogType: null | 'showRefs' | 'error'
}

// Get pixel density of the current device
const DPI =
  typeof window === 'undefined' || !window.devicePixelRatio
    ? 1
    : Math.round(window.devicePixelRatio)

const DIALOG_DELETE_ACTION: AssetAction = {
  name: 'delete',
  title: 'Delete',
  icon: TrashIcon,
  color: 'danger'
}

const DIALOG_CLOSE_ACTION: AssetAction = {
  name: 'close',
  title: 'Close'
}

export default class Asset extends React.PureComponent<AssetProps, State> {
  state: State = {
    isDeleting: false,
    dialogType: null
  }

  handleDeleteAsset = asset => {
    const {onDeleteFinished} = this.props

    this.setState({isDeleting: true})

    return client
      .delete(asset._id)
      .then(() => {
        this.setState({isDeleting: false})
        onDeleteFinished(asset._id)
      })
      .catch(err => {
        this.setState({isDeleting: false, dialogType: 'error'})
        // eslint-disable-next-line no-console
        console.error('Could not delete asset', err)
      })
  }

  handleDialogClose = () => {
    this.setState({dialogType: null})
  }

  handleMenuAction = (action: AssetAction) => {
    if (action.name === 'delete') {
      this.handleDeleteAsset(this.props.asset)
    } else if (action.name === 'showRefs') {
      this.setState({dialogType: 'showRefs'})
    }
  }

  handleDialogAction = (action: AssetAction) => {
    if (action.name === 'close') {
      this.handleDialogClose()
    } else if (action.name === 'delete') {
      this.handleDeleteAsset(this.props.asset)
    }
  }

  getDialogActions = dialogType => {
    if (dialogType != 'error') {
      return [DIALOG_DELETE_ACTION, DIALOG_CLOSE_ACTION]
    }

    return [DIALOG_CLOSE_ACTION]
  }

  // eslint-disable-next-line complexity
  render() {
    const {asset, onClick, onKeyPress, isSelected} = this.props
    const {isDeleting, dialogType} = this.state
    const size = 75
    const imgH = 100 * Math.max(1, DPI)
    const width = get(asset, 'metadata.dimensions.width') || 100
    const height = get(asset, 'metadata.dimensions.height') || 100

    return (
      <a
        className={classNames(styles.root, isSelected && styles.selected)}
        tabIndex={0}
        data-id={asset._id}
        onKeyPress={onKeyPress}
        style={{
          width: `${(width * size) / height}px`,
          flexGrow: (width * size) / height
        }}
      >
        <div
          className={styles.imageContainer}
          style={{paddingBottom: `${(height / width) * 100}%`}}
        >
          <img
            src={`${asset.url}?h=${imgH}&fit=max`}
            className={styles.image}
            onClick={onClick}
            data-id={asset._id}
          />

          {isDeleting && (
            <div className={styles.spinnerContainer}>
              <Spinner center />
            </div>
          )}
        </div>

        <div className={styles.menuContainer}>
          <AssetMenu isSelected={isSelected} onAction={this.handleMenuAction} />

          {dialogType && (
            <AssetDialog
              actions={this.getDialogActions(dialogType)}
              asset={asset}
              dialogType={dialogType}
              onAction={this.handleDialogAction}
              onClose={this.handleDialogClose}
            />
          )}
        </div>
      </a>
    )
  }
}
