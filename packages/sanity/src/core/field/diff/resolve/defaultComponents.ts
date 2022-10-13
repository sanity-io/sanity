import {ComponentType} from 'react'

import {BooleanFieldDiff} from '../../types/boolean/diff'
import {FileFieldDiff} from '../../types/file/diff'
import {ImageFieldDiff} from '../../types/image/diff'
import {NumberFieldDiff} from '../../types/number/diff'
import {PTDiff} from '../../types/portableText/diff'
import {ReferenceFieldDiff} from '../../types/reference/diff'
import {StringFieldDiff} from '../../types/string/diff'
// import {ObjectFieldDiff} from '../../types/object/diff'
// import {ArrayFieldDiff} from '../../types/array/diff/ArrayFieldDiff'

export const defaultComponents: Record<string, ComponentType<any> | undefined> = {
  // array: ArrayFieldDiff, // TODO
  block: PTDiff,
  boolean: BooleanFieldDiff,
  file: FileFieldDiff,
  image: ImageFieldDiff,
  number: NumberFieldDiff,
  // object: ObjectFieldDiff, // TODO
  reference: ReferenceFieldDiff,
  string: StringFieldDiff,
}
