import {type PropsWithChildren, Suspense, useContext} from 'react'
import {AssetLimitUpsellContext, type AssetLimitUpsellContextValue} from 'sanity/_singletons'

import {useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellContextDialog} from '../../../studio/upsell/UpsellContextDialog'

export function AssetLimitUpsellProvider({children}: PropsWithChildren) {
  const contextValue = useUpsellContext({
    dataUri: '/journey/asset-limit',
    feature: 'asset-limits',
  })

  return (
    <AssetLimitUpsellContext.Provider value={contextValue}>
      {children}
      <Suspense>
        <UpsellContextDialog contextValue={contextValue} />
      </Suspense>
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
