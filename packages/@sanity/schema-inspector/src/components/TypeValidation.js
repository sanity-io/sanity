// @flow
import React from 'react'

import ObjectValidation from './ObjectValidation'
import ArrayValidation from './ArrayValidation'
import DefaultValidation from './DefaultValidation'

type Props = {
  getPath: () => string[],
  type: any
}

const components = {
  object: ObjectValidation,
  document: ObjectValidation,
  array: ArrayValidation
}

export class TypeValidation extends React.Component<Props> {
  render() {
    const {type, getPath} = this.props

    const ValidationComponent = components[type.type] || DefaultValidation
    return <ValidationComponent type={type} getPath={getPath} />
  }
}
