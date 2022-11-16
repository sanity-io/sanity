import React from 'react'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'
import {CommonDateInput} from './CommonDate'

export function FieldInputDate(props: OperatorInputComponentProps<string>) {
  return <CommonDateInput {...props} />
}
