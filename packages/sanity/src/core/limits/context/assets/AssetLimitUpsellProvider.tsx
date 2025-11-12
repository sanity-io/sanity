import {type PropsWithChildren, useContext} from 'react'
import {AssetLimitUpsellContext, type AssetLimitUpsellContextValue} from 'sanity/_singletons'

import {getDialogPropsFromContext, useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'

export function AssetLimitUpsellProvider({children}: PropsWithChildren) {
  const contextValue = useUpsellContext({
    dataUri: '/journey/asset-limit',
    feature: 'asset-limits',
  })

  return (
    <AssetLimitUpsellContext.Provider value={contextValue}>
      {children}
      <UpsellDialog {...getDialogPropsFromContext(contextValue)} />
    </AssetLimitUpsellContext.Provider>
  )
}

/**
 * @internal
 */
export const useAssetLimitsUpsellContext = (): AssetLimitUpsellContextValue => {
  const context = useContext(AssetLimitUpsellContext)
  if (!context) {
    throw new Error('useAssetLimitsUpsellContext must be used within a AssetLimitUpsellProvider')
  }
  return context
}
