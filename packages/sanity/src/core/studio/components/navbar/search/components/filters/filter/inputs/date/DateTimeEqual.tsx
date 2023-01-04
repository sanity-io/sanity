import React from 'react'
import {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateEqualInput} from './CommonDateEqual'

export function SearchFilterDateTimeEqualInput(props: OperatorInputComponentProps<string>) {
  return <CommonDateEqualInput {...props} isDateTime />
}
