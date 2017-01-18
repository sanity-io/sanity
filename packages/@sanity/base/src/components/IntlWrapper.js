import React, {PropTypes} from 'react'
import {intlShape} from 'part:@sanity/base/locale/intl'

let intl = null

export class IntlWrapper extends React.Component {
  static contextTypes = {
    intl: intlShape
  };

  static propTypes = {
    children: PropTypes.node.isRequired
  }

  componentWillMount() {
    intl = this.context.intl
  }

  componentWillUpdate() {
    intl = this.context.intl
  }

  render() {
    return <div>{this.props.children}</div>
  }
}

const proxies = [
  'formatDate', 'formatTime', 'formatRelative', 'formatNumber',
  'formatPlural', 'formatMessage', 'formatHTMLMessage'
].reduce((target, fnName) => {
  target[fnName] = (...args) => {
    if (!intl) {
      throw new Error('IntlWrapper must be mounted before using format* functions')
    }

    return intl[fnName](...args)
  }
  return target
}, {})

export const formatDate = proxies.formatDate
export const formatTime = proxies.formatTime
export const formatNumber = proxies.formatNumber
export const formatPlural = proxies.formatPlural
export const formatRelative = proxies.formatRelative
export const formatHTMLMessage = (desc, values) => {
  return typeof desc === 'string'
    ? proxies.formatHTMLMessage({id: desc}, values)
    : proxies.formatHTMLMessage(desc, values)
}

export const formatMessage = (desc, values) => {
  return typeof desc === 'string'
    ? proxies.formatMessage({id: desc}, values)
    : proxies.formatMessage(desc, values)
}
