import React, {PropTypes} from 'react'
import omit from 'lodash/omit'
import Link from './Link'

const EMPTY_STATE = {}

export default class StateLink extends React.Component {
  resolveUrl() {
    const {toIndex, state} = this.props

    if (state && toIndex) {
      throw new Error('Passing both `state` and `toIndex` as props to StateLink is invalid')
    }

    if (!state && !toIndex) {
      console.error(new Error('No state passed to StateLink. If you want to link to an empty state, its better to use the the `toIndex` property'))
    }
    const nextState = toIndex ? EMPTY_STATE : (state || EMPTY_STATE)

    return this.context.__internalRouter.resolvePathFromState(nextState)
  }
  render() {
    const rest = omit(this.props, 'state', 'toIndex')
    return <Link href={this.resolveUrl()} {...rest} />
  }
}

StateLink.defaultProps = {
  replace: false,
  toIndex: false,
}
StateLink.propTypes = {
  state: PropTypes.object,
  replace: PropTypes.bool
}
StateLink.contextTypes = {
  __internalRouter: PropTypes.object
}