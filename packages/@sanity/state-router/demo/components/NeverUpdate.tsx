import * as React from 'react'
import ProductCounter from './ProductCounter'

export default class NeverUpdate extends React.Component {
  shouldComponentUpdate() {
    return false
  }
  render() {
    return (
      <span>
        Hello this is a component that never updates. It includs another component that depends on
        router state
        <ProductCounter />
      </span>
    )
  }
}
