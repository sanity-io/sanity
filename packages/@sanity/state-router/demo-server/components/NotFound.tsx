import React from 'react'
import StateLink from '../../src/components/StateLink'

export default class NotFound extends React.PureComponent {
  render() {
    return (
      <div>
        <h2>Page not found</h2>
        <StateLink toIndex>Go to index</StateLink>
      </div>
    )
  }
}
