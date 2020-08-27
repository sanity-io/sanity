import {DiffComponent} from '../types'
import {NumberFieldDiff} from './number'
import {StringFieldDiff} from './string'
import {ReferenceFieldDiff} from './reference'
import {ImageFieldDiff} from './image'
import {FileFieldDiff} from './file'
import {BooleanFieldDiff} from './boolean'

export const defaultComponents: {[key: string]: DiffComponent<any>} = {
  string: StringFieldDiff,
  number: NumberFieldDiff,
  reference: ReferenceFieldDiff,
  image: ImageFieldDiff,
  boolean: BooleanFieldDiff,
  file: FileFieldDiff
}
