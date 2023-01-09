import React from 'react'
import type {OperatorDateDirectionValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateDirectionInput} from './CommonDateDirection'

export function SearchFilterDateBeforeInput(
  props: OperatorInputComponentProps<OperatorDateDirectionValue>
) {
  return <CommonDateDirectionInput {...props} direction="before" isDateTime={false} />
}
