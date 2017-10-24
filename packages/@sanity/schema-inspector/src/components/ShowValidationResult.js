// @flow
import React from 'react'
import {TypeValidation} from './TypeValidation'

type Props = {
  result: Array<Object>
}

export default class ShowValidationResult extends React.Component<Props> {
  render() {
    const {result} = this.props
    return (
      <div>
        {result.map((type, i) => (
          <TypeValidation type={type} getPath={() => []} />
        ))}
      </div>
    )
  }
}
