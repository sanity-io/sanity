import React from 'react'
import type {OperatorDateEqualValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateEqualInput} from './CommonDateEqual'

export function SearchFilterDateEqualInput(
  props: OperatorInputComponentProps<OperatorDateEqualValue>
) {
  return <CommonDateEqualInput {...props} isDateTime={false} />
}
