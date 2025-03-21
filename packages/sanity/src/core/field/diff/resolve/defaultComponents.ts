import {type DiffComponent, type DiffComponentOptions} from '../../types'
import {BooleanFieldDiff} from '../../types/boolean/diff/BooleanFieldDiff'
import {DatetimeFieldDiff} from '../../types/datetime/diff/DatetimeFieldDiff'
import {FileFieldDiff} from '../../types/file/diff/FileFieldDiff'
import {ImageFieldDiff} from '../../types/image/diff/ImageFieldDiff'
import {NumberFieldDiff} from '../../types/number/diff/NumberFieldDiff'
import {PTDiff} from '../../types/portableText/diff/PTDiff'
import {ReferenceFieldDiff} from '../../types/reference/diff/ReferenceFieldDiff'
import {StringFieldDiff} from '../../types/string/diff/StringFieldDiff'

export const defaultComponents: Record<
  string,
  DiffComponent<any> | DiffComponentOptions<any> | undefined
> = {
  block: PTDiff,
  boolean: {component: BooleanFieldDiff, showHeader: false},
  date: DatetimeFieldDiff,
  datetime: DatetimeFieldDiff,
  file: FileFieldDiff,
  image: ImageFieldDiff,
  number: NumberFieldDiff,
  reference: ReferenceFieldDiff,
  string: StringFieldDiff,
}
