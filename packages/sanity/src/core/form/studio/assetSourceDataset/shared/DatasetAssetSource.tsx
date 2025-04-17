import {type AssetSourceComponentProps} from '@sanity/types'
import {type ForwardedRef, forwardRef, memo} from 'react'

import {SelectAssetsDialog} from './SelectAssetsDialog'

const DatasetAssetSourceComponent = function DatasetAssetSourceComponent(
  props: AssetSourceComponentProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {action = 'select'} = props

  if (action === 'select') {
    return <SelectAssetsDialog {...props} ref={ref} />
  }
  return null
}

export const DatasetAssetSource = memo(forwardRef(DatasetAssetSourceComponent))
