import {DiffComponent} from './types'
import {NumberFieldDiff} from './NumberFieldDiff'
import {StringFieldDiff} from './StringFieldDiff'
import {ReferenceFieldDiff} from './ReferenceFieldDiff'
import {ImageFieldDiff} from './ImageFieldDiff'
import {BooleanFieldDiff} from './BooleanFieldDiff'
import {SlugFieldDiff} from './SlugFieldDiff'

export const defaultComponents: {[key: string]: DiffComponent<any>} = {
  string: StringFieldDiff,
  number: NumberFieldDiff,
  reference: ReferenceFieldDiff,
  image: ImageFieldDiff,
  boolean: BooleanFieldDiff,
  slug: SlugFieldDiff
}
