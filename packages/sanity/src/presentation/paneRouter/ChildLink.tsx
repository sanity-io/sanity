import {type RefAttributes} from 'react'
import {StateLink} from 'sanity/router'

import {type ChildLinkProps} from '../../structure/components/paneRouter/types'
import {type PresentationSearchParams} from '../types'

export function ChildLink(
  props: ChildLinkProps & {
    childType: string
    searchParams: PresentationSearchParams
  } & RefAttributes<HTMLAnchorElement>,
) {
  const {ref, childId, childType, childPayload, childParameters, searchParams, ...rest} = props

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
}
