import React, {PropTypes} from 'react'
import {StateLink} from 'part:@sanity/base/router'

export default function NotFound() {
  return (
    <div>
      <h2>Page not found</h2>
      <StateLink toIndex>Go to index</StateLink>
    </div>
  )
}
