import {type PropsWithChildren, useContext} from 'react'
import {AssetLimitUpsellContext, type AssetLimitUpsellContextValue} from 'sanity/_singletons'

import {useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellContextDialog} from '../../../studio/upsell/UpsellContextDialog'

export function AssetLimitUpsellProvider({children}: PropsWithChildren) {
  // Only an asset limit error opens the dialog, which starts the request when it opens
  const contextValue = useUpsellContext({
    dataUri: '/journey/asset-limit',
    feature: 'asset-limits',
    preLoadData: false,
  })

  return (
    <AssetLimitUpsellContext.Provider value={contextValue}>
      {children}
      <UpsellContextDialog contextValue={contextValue} />
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
