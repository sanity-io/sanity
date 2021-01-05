import classNames from 'classnames'
import React from 'react'
import client from 'part:@sanity/base/client'
import AssetDialog from './AssetDialog'
import AssetMenu from './AssetMenu'
import {AssetAction, AssetRecord} from './types'
import {FullscreenSpinner} from '../../../components/FullscreenSpinner'

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

export default class Asset extends React.PureComponent<AssetProps, State> {
  state: State = {
    isDeleting: false,
    dialogType: null,
  }

  handleDeleteAsset = (asset) => {
    const {onDeleteFinished} = this.props

    this.setState({isDeleting: true})

    return client
      .delete(asset._id)
      .then(() => {
        this.setState({isDeleting: false})
        onDeleteFinished(asset._id)
      })
      .catch((err) => {
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
    }

    if (action.name === 'showRefs') {
      this.setState({dialogType: 'showRefs'})
    }
  }

  handleDialogAction = (action: AssetAction) => {
    if (action.name === 'close') {
      this.handleDialogClose()
    }

    if (action.name === 'delete') {
      this.handleDeleteAsset(this.props.asset)
    }
  }

  render() {
    const {asset, onClick, onKeyPress, isSelected} = this.props
    const {isDeleting, dialogType} = this.state
    const imgH = 200 * Math.max(1, DPI)

    return (
      <a
        className={classNames(styles.root, isSelected && styles.selected)}
        tabIndex={0}
        data-id={asset._id}
        onKeyPress={onKeyPress}
      >
        <div className={styles.imageContainer}>
          <img
            src={`${asset.url}?h=${imgH}&fit=max`}
            className={styles.image}
            onClick={onClick}
            data-id={asset._id}
          />

          {isDeleting && <FullscreenSpinner />}
        </div>

        <div className={styles.menuContainer}>
          <AssetMenu isSelected={isSelected} onAction={this.handleMenuAction} />

          {dialogType && (
            <AssetDialog
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
