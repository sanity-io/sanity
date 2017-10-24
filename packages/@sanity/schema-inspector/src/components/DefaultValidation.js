// @flow
import React from 'react'
import Problems from './Problems'
import {Name, Type} from './PathSegments'

type Props = {
  getPath: () => string[],
  type: Object
}

export default class DefaultValidation extends React.Component<Props> {
  getPath = () => {
    const {getPath, type} = this.props
    return [
      ...getPath(),
      <span>
        <Name>{type.name || '<unnamed>'}</Name>
        <Type>{type.type || '<unknown>'}</Type>
      </span>
    ]
  }

  render() {
    const {type} = this.props
    return type._problems ? (
      <Problems problems={type._problems} getPath={this.getPath} />
    ) : null
  }
}
