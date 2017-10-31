import type {PathSegment} from './utils/patches'
import PropTypes from 'prop-types'
import React from 'react'
import {arrayToJSONMatchPath} from '@sanity/mutator'

function formatPath(path) {
  return arrayToJSONMatchPath(path)
}
export default class MemberValue extends React.Component {
  props: {
    path: PathSegment | Array<PathSegment>,
    children: Element<*>
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

  render() {
    const p = formatPath(this.getValuePath())
    return (
      <div>
        <a name={p} href={`#${p}`}>link</a>
        {this.props.children}
      </div>
    )
  }
}
