import React from 'react'
import type {OperatorDateEqualValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateEqualInput} from './CommonDateEqual'

export function SearchFilterDateTimeEqualInput(
  props: OperatorInputComponentProps<OperatorDateEqualValue>
) {
  return <CommonDateEqualInput {...props} isDateTime />
}
