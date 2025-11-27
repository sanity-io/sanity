import {type OperatorDateEqualValue} from '../../../../../definitions/operators/dateOperators'
import {type OperatorInputComponentProps} from '../../../../../definitions/operators/operatorTypes'
import {CommonDateEqualInput} from './CommonDateEqual'

export function SearchFilterDateTimeEqualInput(
  props: OperatorInputComponentProps<OperatorDateEqualValue>,
) : React.JSX.Element {
  return <CommonDateEqualInput {...props} isDateTime />
}
