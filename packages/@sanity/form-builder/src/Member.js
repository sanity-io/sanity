import type {PathSegment} from './utils/patches'
import PropTypes from 'prop-types'
import React from 'react'
import {arrayToJSONMatchPath} from '@sanity/mutator'
import styles from './styles/Member.css'
import copy from 'copy-to-clipboard'

function formatPath(path) {
  return arrayToJSONMatchPath(path)
}

export default class MemberValue extends React.Component {
  props: {
    path: PathSegment | Array<PathSegment>,
    children: Element<*>
  }

  state = {
    copied: null
  }

  static contextTypes = {
    getValuePath: PropTypes.func
  }

  static childContextTypes = {
    getValuePath: PropTypes.func
  }

  getValuePath = () => {
    return this.context.getValuePath().concat(this.props.path)
  }

  getChildContext() {
    return {
      getValuePath: this.getValuePath
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer)
  }

  handleCopy = event => {
    clearTimeout(this.timer)
    copy(event.currentTarget.href)
    this.setState({
      copied: event.currentTarget.href
    })
    this.timer = setTimeout(() => {
      this.setState({copied: null})
    }, 1000)
    event.preventDefault()
  }

  render() {
    const serializedPath = formatPath(this.getValuePath())
    const {copied} = this.state
    return (
      <div className={styles.root}>
        {/*<div className={styles.copyPathAnchorContainer}>*/}
          {/*<a*/}
            {/*className={styles.copyPathAnchor}*/}
            {/*onClick={this.handleCopy}*/}
            {/*name={serializedPath}*/}
            {/*title={copied ? 'Copied!' : 'Copy to clipboard'}*/}
            {/*href={`#${serializedPath}`}*/}
          {/*>*/}
            {/*{copied ? '👍' : '📎'}*/}
          {/*</a>*/}
        {/*</div>*/}
        {this.props.children}
      </div>
    )
  }
}
