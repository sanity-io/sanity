import PropTypes from 'prop-types'
import React, {createContext, useContext} from 'react'
import {useDispatch} from 'react-redux'
import {
  assetsDelete,
  assetsDeletePicked,
  assetsFetch,
  assetsPick,
  assetsPickAll,
  assetsPickClear
} from '../modules/assets'
import {dialogShowConflicts, dialogShowRefs} from '../modules/dialog'

const AssetBrowserDispatchContext = createContext()

export const AssetBrowserDispatchProvider = props => {
  const {children, onSelect} = props

  const dispatch = useDispatch()

  const contextValue = {
    onDelete: (asset, handleTarget) => dispatch(assetsDelete(asset, handleTarget)),
    onDeletePicked: () => dispatch(assetsDeletePicked()),
    onDialogShowConflicts: asset => dispatch(dialogShowConflicts(asset)),
    onDialogShowRefs: asset => dispatch(dialogShowRefs(asset)),
    onFetch: options => {
      dispatch(assetsFetch(options))
    },
    onPick: (assetId, value) => dispatch(assetsPick(assetId, value)),
    onPickAll: () => dispatch(assetsPickAll()),
    onPickClear: () => dispatch(assetsPickClear()),
    onSelect
  }

  return (
    <AssetBrowserDispatchContext.Provider value={contextValue}>
      {children}
    </AssetBrowserDispatchContext.Provider>
  )
}

AssetBrowserDispatchProvider.propTypes = {
  children: PropTypes.node,
  onSelect: PropTypes.func
}

export const useAssetBrowserActions = () => useContext(AssetBrowserDispatchContext)

export default AssetBrowserDispatchContext
