import {Inline} from '@sanity/ui'
import {styled} from 'styled-components'

import {AccessPolicyBadge} from '../common/AccessPolicyBadge'
import {type AssetAccessPolicy} from '../types'

export const Wrapper = styled(Inline)`
  position: absolute;
  top: 0;
  left: 0;
`

export function ImageAccessPolicy(props: {accessPolicy: AssetAccessPolicy}) {
  const {accessPolicy} = props

  if (accessPolicy === 'private') {
    return (
      <Wrapper padding={2}>
        <AccessPolicyBadge />
      </Wrapper>
    )
  }
  return null
}
