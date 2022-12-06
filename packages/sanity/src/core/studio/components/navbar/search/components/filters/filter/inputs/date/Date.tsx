import React from 'react'
import {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateInput} from './CommonDate'

export function SearchFilterDateInput(props: OperatorInputComponentProps<string>) {
  return <CommonDateInput {...props} />
}
