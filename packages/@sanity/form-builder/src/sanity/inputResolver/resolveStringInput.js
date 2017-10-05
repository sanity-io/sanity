import {get} from 'lodash'
import StringSelect from '../../inputs/StringSelect'
import SearchableStringSelect from '../../inputs/SearchableStringSelect'

export function getOption(type, optionName) {
  return get(type.options, optionName)
}

export default function resolveArrayInput(type) {
  if (getOption(type, 'list')) {
    return getOption(type, 'searchable') ? SearchableStringSelect : StringSelect
  }
  return null
}
