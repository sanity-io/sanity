import {DiffComponent} from '../types'
import {NumberFieldDiff} from './number'
import {StringFieldDiff} from './string'
import {ReferenceFieldDiff} from './reference'
import {ImageFieldDiff} from './image'
import {FileFieldDiff} from './file'
import {BooleanFieldDiff} from './boolean'
import {ObjectFieldDiff} from './object'

export const defaultComponents: {[key: string]: DiffComponent<any>} = {
  object: ObjectFieldDiff,
  string: StringFieldDiff,
  number: NumberFieldDiff,
  reference: ReferenceFieldDiff,
  image: ImageFieldDiff,
  boolean: BooleanFieldDiff,
  file: FileFieldDiff
}
