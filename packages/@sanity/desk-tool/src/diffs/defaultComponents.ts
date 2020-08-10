import {DiffComponent} from './types'
import {NumberFieldDiff} from './NumberFieldDiff'
import {StringFieldDiff} from './StringFieldDiff'

export const defaultComponents: {[key: string]: DiffComponent<any>} = {
  string: StringFieldDiff,
  number: NumberFieldDiff
}
