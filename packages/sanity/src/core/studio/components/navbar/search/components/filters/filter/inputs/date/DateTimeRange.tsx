import {type OperatorDateRangeValue} from '../../../../../definitions/operators/dateOperators'
import {type OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateRangeInput} from './CommonDateRange'

export function SearchFilterDateTimeRangeInput(
  props: OperatorInputComponentProps<OperatorDateRangeValue>,
) : React.JSX.Element {
  return <CommonDateRangeInput {...props} isDateTime />
}
