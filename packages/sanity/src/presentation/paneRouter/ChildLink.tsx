import {forwardRef} from 'react'
import {StateLink} from 'sanity/router'
import {type ChildLinkProps} from 'sanity/structure'

import {type PresentationSearchParams} from '../types'

export const ChildLink = forwardRef(function ChildLink(
  props: ChildLinkProps & {
    childType: string
    searchParams: PresentationSearchParams
  },
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const {childId, childType, childPayload, childParameters, searchParams, ...rest} = props

  return (
    <StateLink
      {...rest}
      ref={ref}
      state={{
        id: childId,
        type: childType,
        _searchParams: Object.entries({...searchParams, ...childParameters}),
      }}
    />
  )
})
