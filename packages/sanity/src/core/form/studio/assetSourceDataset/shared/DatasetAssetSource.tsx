import {type AssetSourceComponentProps} from '@sanity/types'
import {memo, type RefAttributes} from 'react'

import {SelectAssetsDialog} from './SelectAssetsDialog'

const DatasetAssetSourceComponent = function DatasetAssetSourceComponent(
  props: AssetSourceComponentProps & RefAttributes<HTMLDivElement>,
) {
  const {ref, action = 'select'} = props

  if (action === 'select') {
    return <SelectAssetsDialog {...props} ref={ref} />
  }
  return null
}

export const DatasetAssetSource = memo(DatasetAssetSourceComponent)
