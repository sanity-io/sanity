import type {PathSegment} from './utils/patches'
import React, {PropTypes} from 'react'

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

  getChildContext() {
    return {
      getValuePath: () => this.context.getValuePath().concat(this.props.path)
    }
  }

  render() {
    return this.props.children
  }
}
