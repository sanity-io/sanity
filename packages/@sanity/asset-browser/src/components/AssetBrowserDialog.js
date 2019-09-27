import PropTypes from 'prop-types'
import React from 'react'
import Dialog from 'part:@sanity/components/dialogs/fullscreen'
import AssetBrowser from './AssetBrowser'

const AssetBrowserDialog = props => {
  const {customAssetSelect, onClose, onSelect} = props

  return (
    <Dialog
      isOpen
      onClose={onClose}
      padding={customAssetSelect ? 'none' : undefined}
      title={customAssetSelect ? undefined : 'Select image'}
    >
      <AssetBrowser customAssetSelect={customAssetSelect} onSelect={onSelect} />
    </Dialog>
  )
}

AssetBrowserDialog.propTypes = {
  customAssetSelect: PropTypes.elementType,
  onClose: PropTypes.func,
  onSelect: PropTypes.func
}

export default AssetBrowserDialog
