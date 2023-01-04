import React from 'react'
import {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateEqualInput} from './CommonDateEqual'

export function SearchFilterDateEqualInput(props: OperatorInputComponentProps<string>) {
  return <CommonDateEqualInput {...props} useInputDateFormat />
}
