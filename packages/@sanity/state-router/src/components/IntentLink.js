import PropTypes from 'prop-types'
// @flow
import React, { Element } from 'react';
import Link from './Link'
import type {RouterProviderContext} from './types'

export default class IntentLink extends React.PureComponent {
  props: {
    intent: string,
    params?: Object,
    children: Element<*>,
    className: string
  };

  context: RouterProviderContext

  static contextTypes = {
    __internalRouter: PropTypes.object
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
    const {intent, params, ...rest} = this.props

    const url = this.context.__internalRouter.resolveIntentLink(intent, params)
    return <Link href={url} {...rest} ref={this.setElement} />
  }
}
