import {type DiffComponent, type DiffComponentOptions} from '../../types'
import {BooleanFieldDiff} from '../../types/boolean/diff/BooleanFieldDiff'
import {DatetimeFieldDiff} from '../../types/datetime/diff/DatetimeFieldDiff'
import {FileFieldDiff} from '../../types/file/diff/FileFieldDiff'
import {ImageFieldDiff} from '../../types/image/diff/ImageFieldDiff'
import {NumberFieldDiff} from '../../types/number/diff/NumberFieldDiff'
import {PTDiff} from '../../types/portableText/diff/PTDiff'
import {ReferenceFieldDiff} from '../../types/reference/diff/ReferenceFieldDiff'
import {SlugFieldDiff} from '../../types/slug/diff/SlugFieldDiff'
import {StringFieldDiff} from '../../types/string/diff/StringFieldDiff'

/**
 * `block`, `image`, and `file` are read through getters. Those components import
 * `ChangeList`, which circularly loads this module via `buildObjectChangeList` →
 * `resolveDiffComponent`. A plain property would capture `undefined` while the
 * cycle is still evaluating. The getter reads the live binding after init.
 * SAPP-4648.
 */
export const defaultComponents: Record<
  string,
  DiffComponent<any> | DiffComponentOptions<any> | undefined
> = {
  get block() {
    return PTDiff
  },
  boolean: {component: BooleanFieldDiff, showHeader: false},
  date: DatetimeFieldDiff,
  datetime: DatetimeFieldDiff,
  get file() {
    return FileFieldDiff
  },
  get image() {
    return ImageFieldDiff
  },
  number: NumberFieldDiff,
  reference: ReferenceFieldDiff,
  crossDatasetReference: ReferenceFieldDiff,
  slug: SlugFieldDiff,
  string: StringFieldDiff,
}
