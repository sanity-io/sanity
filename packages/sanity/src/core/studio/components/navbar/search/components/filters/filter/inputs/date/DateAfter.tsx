import React from 'react'
import type {OperatorDateDirectionValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateDirectionInput} from './CommonDateDirection'

export function SearchFilterDateAfterInput(
  props: OperatorInputComponentProps<OperatorDateDirectionValue>
) {
  return <CommonDateDirectionInput {...props} direction="after" isDateTime={false} />
}
