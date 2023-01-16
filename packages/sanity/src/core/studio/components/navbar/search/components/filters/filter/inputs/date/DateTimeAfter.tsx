import React from 'react'
import type {OperatorDateDirectionValue} from '../../../../../definitions/operators/dateOperators'
import type {OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateDirectionInput} from './CommonDateDirection'

export function SearchFilterDateTimeAfterInput(
  props: OperatorInputComponentProps<OperatorDateDirectionValue>
) {
  return <CommonDateDirectionInput {...props} direction="after" isDateTime />
}
