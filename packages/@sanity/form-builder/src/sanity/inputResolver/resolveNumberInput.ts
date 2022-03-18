import {SelectInput} from '../../inputs/SelectInput'
import {NumberInput} from '../../inputs/NumberInput'
import {getOption} from './resolveStringInput'

export function resolveNumberInput(type) {
  return getOption(type, 'list') ? SelectInput : NumberInput
}
