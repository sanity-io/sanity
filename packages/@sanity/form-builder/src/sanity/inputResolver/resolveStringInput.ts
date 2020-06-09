import {get} from 'lodash'
import SelectInput from '../../inputs/SelectInput'
import StringInput from '../../inputs/StringInput'

export function getOption(type, optionName) {
  return get(type.options, optionName)
}

export default function resolveStringInput(type) {
  return getOption(type, 'list') ? SelectInput : StringInput
}
