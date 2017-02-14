// @flow
import React, {PropTypes} from 'react'
import omit from 'lodash/omit'
import Link from './Link'
import type {RouterProviderContext} from './types'

const EMPTY_STATE = {}

export default class StateLink extends React.PureComponent {
  props: {
    state?: Object,
    toIndex?: boolean
  }
  context: RouterProviderContext

  static defaultProps = {
    replace: false,
    toIndex: false,
  }

  static contextTypes = {
    __internalRouter: PropTypes.object
  }

  resolveUrl() : string {
    const {toIndex, state} = this.props

    if (state && toIndex) {
      throw new Error('Passing both `state` and `toIndex` as props to StateLink is invalid')
    }

    if (!state && !toIndex) {
      // eslint-disable-next-line no-console
      console.error(new Error('No state passed to StateLink. If you want to link to an empty state, its better to use the the `toIndex` property'))
    }

    const nextState = toIndex ? EMPTY_STATE : (state || EMPTY_STATE)

    return this.context.__internalRouter.resolvePathFromState(nextState)
  }


  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  setElement = element => {
    this._element = element
  }

  render() {
    const rest = omit(this.props, 'replace', 'state', 'toIndex')
    return <Link href={this.resolveUrl()} {...rest} ref={this.setElement} />
  }
}
