// @flow
import React from 'react'
import Problems from './Problems'
import {TypeValidation} from './TypeValidation'

type Props = {
  getPath: () => string[],
  type: Object
}

export default class ObjectValidation extends React.Component<Props> {
  getPath = () => {
    const {type, getPath} = this.props
    return [
      ...getPath(),
      [<span>{type.type}{type.name || 'anonymous'}</span>]
    ]
  }
  getOfTypePath = () => {
    return [...this.getPath(), `of`]
  }
  render() {
    const {type} = this.props
    return (
      <div>
        {type._problems && (
          <Problems problems={type._problems} getPath={this.getPath}>
            {type.of.map(ofType => (
              <TypeValidation
                key={ofType.name}
                type={ofType}
                getPath={this.getOfTypePath}
              />
            ))}
          </Problems>
        )}
      </div>
    )
  }
}
