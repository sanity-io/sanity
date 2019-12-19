import React from 'react'
import {withRouterHOC, StateLink} from 'part:@sanity/base/router'
import {HAS_SPACES} from '../util/spaces'

export default withRouterHOC(function NotFound(props) {
  const router = props.router
  const rootState = HAS_SPACES && router.state.space ? {space: router.state.space} : {}
  return (
    <div>
      <h2>Page not found</h2>
      {props.children}
      <StateLink state={rootState}>Go to index</StateLink>
    </div>
  )
})
