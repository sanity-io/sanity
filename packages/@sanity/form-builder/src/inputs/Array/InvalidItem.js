// @flow
import React from 'react'
import {resolveTypeName} from '../../utils/resolveTypeName'
import InvalidValue from '../InvalidValue'
import PatchEvent from '../../PatchEvent'

type Type = {
  name: string,
  of: Array<Type>
}

export default class Item extends React.PureComponent {
  props: {
    // note: type here is the *array* type
    type: Type,
    value: any,
    onChange: (PatchEvent, value: any) => void
  };

  handleChange = (event : PatchEvent) => {
    const {onChange, value} = this.props
    onChange(event, value)
  }

  render() {
    const {type, value} = this.props

    const actualType = resolveTypeName(value)
    const validTypes = type.of.map(ofType => ofType.name)
    return (
      <InvalidValue
        actualType={actualType}
        validTypes={validTypes}
        onChange={this.handleChange}
        value={value}
      />
    )
  }
}
