import {Inline} from '@sanity/ui'

import {AccessPolicyBadge} from '../common/AccessPolicyBadge'
import {type AssetAccessPolicy} from '../types'
import {wrapper} from './ImageAccessPolicy.css'

export function ImageAccessPolicy(props: {accessPolicy: AssetAccessPolicy}) {
  const {accessPolicy} = props

  if (accessPolicy === 'private') {
    return (
      <Inline className={wrapper} padding={2}>
        <AccessPolicyBadge />
      </Inline>
    )
  }
  return null
}
