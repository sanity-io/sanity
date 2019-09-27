import PropTypes from 'prop-types'
import React from 'react'
import {AssetBrowserDispatchProvider} from 'part:@sanity/asset-browser/context/dispatch'
import {AssetBrowserStateProvider} from 'part:@sanity/asset-browser/context/state'
import withRedux from '../helpers/withRedux'
import AssetSelect from './AssetSelect'
import Dialog from './Dialog'
import Snackbars from './Snackbars'

const AssetBrowser = props => {
  const {customAssetSelect, onSelect} = props

  let CustomAssetSelect
  if (customAssetSelect) {
    CustomAssetSelect = customAssetSelect
  }

  return (
    <AssetBrowserDispatchProvider onSelect={onSelect}>
      <AssetBrowserStateProvider>
        <Snackbars />
        <Dialog />
        {customAssetSelect ? <CustomAssetSelect /> : <AssetSelect />}
      </AssetBrowserStateProvider>
    </AssetBrowserDispatchProvider>
  )
}

AssetBrowser.propTypes = {
  customAssetSelect: PropTypes.elementType,
  onSelect: PropTypes.func
}

export default withRedux(AssetBrowser)
