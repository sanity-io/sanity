import React from 'react'
import {StateLink} from 'part:@sanity/base/router'

export default function NotFound(props) {
  return (
    <div>
      <h2>Page not found</h2>
      {props.children}
      <StateLink toIndex>Go to index</StateLink>
    </div>
  )
}
