import {DiffComponent} from './types'
import {NumberFieldDiff} from './NumberFieldDiff'
import {StringFieldDiff} from './StringFieldDiff'
import {ReferenceFieldDiff} from './ReferenceFieldDiff'

export const defaultComponents: {[key: string]: DiffComponent<any>} = {
  string: StringFieldDiff,
  number: NumberFieldDiff,
  reference: ReferenceFieldDiff
}
