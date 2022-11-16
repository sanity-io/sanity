import React from 'react'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'
import {CommonDateInput} from './CommonDate'

export function FieldInputDateTime(props: OperatorInputComponentProps<string>) {
  return <CommonDateInput {...props} selectTime />
}
