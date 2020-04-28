import NumberSelect from '../../inputs/SelectInput'
import NumberInput from '../../inputs/NumberInput'
import {getOption} from './resolveStringInput'

export default function resolveNumberInput(type) {
  return getOption(type, 'list') ? NumberSelect : NumberInput
}
