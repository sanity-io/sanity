import {get} from 'lodash'
import StringSelect from '../../inputs/StringSelect'
import StringInput from '../../inputs/String'

export function getOption(type, optionName) {
  return get(type.options, optionName)
}

export default function resolveStringInput(type) {
  return getOption(type, 'list') ? StringSelect : StringInput
}
