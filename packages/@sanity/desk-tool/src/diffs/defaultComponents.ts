import {DiffComponent} from '@sanity/field/diff'
import {NumberFieldDiff} from './number'
import {StringFieldDiff} from './string'
import {ReferenceFieldDiff} from './reference'
import {ImageFieldDiff} from './image'
import {FileFieldDiff} from './file'
import {BooleanFieldDiff} from './boolean'
import {SlugFieldDiff} from './slug'

export const defaultComponents: {[key: string]: DiffComponent<any>} = {
  string: StringFieldDiff,
  number: NumberFieldDiff,
  reference: ReferenceFieldDiff,
  image: ImageFieldDiff,
  boolean: BooleanFieldDiff,
  slug: SlugFieldDiff,
  file: FileFieldDiff
}
