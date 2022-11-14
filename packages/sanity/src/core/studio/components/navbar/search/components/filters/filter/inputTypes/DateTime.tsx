import React from 'react'
import {OperatorInputComponentProps} from '../../../../definitions/operators/operatorTypes'
import {CommonDateInput} from './CommonDate'

export function FieldInputDateTime(props: OperatorInputComponentProps<Date>) {
  return <CommonDateInput {...props} selectTime />
}
