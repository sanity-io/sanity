import {DiffComponent, DiffComponentOptions} from '../../types'

import {BooleanFieldDiff} from '../../types/boolean/diff'
import {FileFieldDiff} from '../../types/file/diff'
import {ImageFieldDiff} from '../../types/image/diff'
import {NumberFieldDiff} from '../../types/number/diff'
import {PTDiff} from '../../types/portableText/diff'
import {ReferenceFieldDiff} from '../../types/reference/diff'
import {StringFieldDiff} from '../../types/string/diff'

export const defaultComponents: Record<
  string,
  DiffComponent<any> | DiffComponentOptions<any> | undefined
> = {
  block: PTDiff,
  boolean: {component: BooleanFieldDiff, showHeader: false},
  file: FileFieldDiff,
  image: ImageFieldDiff,
  number: NumberFieldDiff,
  reference: ReferenceFieldDiff,
  string: StringFieldDiff,
}
