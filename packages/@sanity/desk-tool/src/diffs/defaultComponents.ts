import {DiffComponent} from './types'
import {ArrayFieldDiff} from './array'
import {NumberFieldDiff} from './number'
import {StringFieldDiff} from './string'
import {ReferenceFieldDiff} from './reference'
import {ImageFieldDiff} from './image'
import {BooleanFieldDiff} from './boolean'
import {SlugFieldDiff} from './slug'

export const defaultComponents: {[key: string]: DiffComponent<any>} = {
  array: ArrayFieldDiff,
  string: StringFieldDiff,
  number: NumberFieldDiff,
  reference: ReferenceFieldDiff,
  image: ImageFieldDiff,
  boolean: BooleanFieldDiff,
  slug: SlugFieldDiff
}
