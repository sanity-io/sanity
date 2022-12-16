import React from 'react'
import {OperatorDateRangeValue} from '../../../../../definitions/operators/dateOperators'
import {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateRangeInput} from './CommonDateRange'

export function SearchFilterDateRangeInput(
  props: OperatorInputComponentProps<OperatorDateRangeValue>
) {
  return <CommonDateRangeInput {...props} />
}
