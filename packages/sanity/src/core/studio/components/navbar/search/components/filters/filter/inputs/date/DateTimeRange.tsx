import React from 'react'
import type {OperatorDateRangeValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateRangeInput} from './CommonDateRange'

export function SearchFilterDateTimeRangeInput(
  props: OperatorInputComponentProps<OperatorDateRangeValue>,
) {
  return <CommonDateRangeInput {...props} isDateTime />
}
