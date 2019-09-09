import React from 'react'
import Link from './Link'
import {RouterProviderContext} from './types'
import internalRouterContextTypeCheck from './internalRouterContextTypeCheck'

const EMPTY_STATE = {}

type Props = {
  state?: Object
  toIndex?: boolean
}

export default class StateLink extends React.PureComponent<Props> {
  context: RouterProviderContext
  _element: Link

  static defaultProps = {
    replace: false,
    toIndex: false
  }

  static contextTypes = {
    __internalRouter: internalRouterContextTypeCheck
  }

  resolveUrl(): string {
    const {toIndex, state} = this.props

    if (state && toIndex) {
      throw new Error('Passing both `state` and `toIndex` as props to StateLink is invalid')
    }

    if (!state && !toIndex) {
      // eslint-disable-next-line no-console
      console.error(
        new Error(
          'No state passed to StateLink. If you want to link to an empty state, its better to use the the `toIndex` property'
        )
      )
    }

    const nextState = toIndex ? EMPTY_STATE : state || EMPTY_STATE

    return this.resolvePathFromState(nextState)
  }

  resolvePathFromState(state: Object) {
    if (!this.context.__internalRouter) {
      return `javascript://state@${JSON.stringify(state)}`
    }
    return this.context.__internalRouter.resolvePathFromState(state)
  }

  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  setElement = (element: Link | null) => {
    if (element) {
      this._element = element
    }
  }

  render() {
    const {state, toIndex, ...rest} = this.props
    return <Link {...rest} href={this.resolveUrl()} ref={this.setElement} />
  }
}
