import PropTypes from 'prop-types'
import React, {createContext, useContext} from 'react'
import {useSelector} from 'react-redux'

const AssetBrowserStateContext = createContext()

export const AssetBrowserStateProvider = props => {
  const {children} = props

  const {allIds, byIds, fetching, fetchingError, totalCount} = useSelector(state => state.assets)
  const items = allIds.map(id => byIds[id])

  const contextValue = {
    fetching,
    fetchingError,
    items,
    totalCount
  }

  return (
    <AssetBrowserStateContext.Provider value={contextValue}>
      {children}
    </AssetBrowserStateContext.Provider>
  )
}

AssetBrowserStateProvider.propTypes = {
  children: PropTypes.node
}

export const useAssetBrowserState = () => useContext(AssetBrowserStateContext)

export default AssetBrowserStateContext
