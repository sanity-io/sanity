// @flow
import React from 'react'
import Problems from './Problems'
import {TypeValidation} from './TypeValidation'
import {Name, Type, Static} from './PathSegments'

type Props = {
  getPath: () => string[],
  type: Object
}

export default class ObjectValidation extends React.Component<Props> {
  getPath = () => {
    const {type, getPath} = this.props
    return [
      ...getPath(),
      <span>
        <Name>{type.name || '<unnamed>'}</Name>
        <Type>{type.type || '<unknown>'}</Type>
      </span>
    ]
  }

  getFieldsPath = () => {
    return [...this.getPath(), <Static>fields</Static>]
  }

  render() {
    const {type} = this.props
    return (
      <div>
        <Problems problems={type._problems} getPath={this.getPath}>
          {type.fields.map((field, i) => (
            <TypeValidation key={i} type={field} getPath={this.getFieldsPath} />
          ))}
        </Problems>
      </div>
    )
  }
}
