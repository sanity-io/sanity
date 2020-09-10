import {DiffComponent, DiffComponentOptions} from '../../types'
import {NumberFieldDiff} from '../../types/number/diff'
import {StringFieldDiff} from '../../types/string/diff'
import {ReferenceFieldDiff} from '../../types/reference/diff'
import {ImageFieldDiff} from '../../types/image/diff'
import {FileFieldDiff} from '../../types/file/diff'
import {BooleanFieldDiff} from '../../types/boolean/diff'

export const defaultComponents: {[key: string]: DiffComponent<any> | DiffComponentOptions<any>} = {
  string: StringFieldDiff,
  number: NumberFieldDiff,
  reference: ReferenceFieldDiff,
  image: ImageFieldDiff,
  file: FileFieldDiff,
  boolean: {component: BooleanFieldDiff, renderHeader: false}
}
