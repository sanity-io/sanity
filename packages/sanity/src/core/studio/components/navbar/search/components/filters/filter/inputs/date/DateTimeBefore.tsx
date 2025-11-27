import {type OperatorDateDirectionValue} from '../../../../../definitions/operators/dateOperators'
import {type OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateDirectionInput} from './CommonDateDirection'

export function SearchFilterDateTimeBeforeInput(
  props: OperatorInputComponentProps<OperatorDateDirectionValue>,
) : React.JSX.Element {
  return <CommonDateDirectionInput {...props} direction="before" isDateTime />
}
