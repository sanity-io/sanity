import {DiffComponent, DiffComponentOptions} from '../../types'

import {BooleanFieldDiff} from '../../types/boolean/diff'
import {FileFieldDiff} from '../../types/file/diff'
import {ImageFieldDiff} from '../../types/image/diff'
import {NumberFieldDiff} from '../../types/number/diff'
import {PortableTextFieldDiff} from '../../types/portableText/diff'
import {ReferenceFieldDiff} from '../../types/reference/diff'
import {SlugFieldDiff} from '../../types/slug/diff'
import {StringFieldDiff} from '../../types/string/diff'
import {UrlFieldDiff} from '../../types/url/diff'

export const defaultComponents: Record<
  string,
  DiffComponent<any> | DiffComponentOptions<any> | undefined
> = {
  block: PortableTextFieldDiff,
  boolean: {component: BooleanFieldDiff, showHeader: false},
  file: FileFieldDiff,
  image: ImageFieldDiff,
  number: NumberFieldDiff,
  reference: ReferenceFieldDiff,
  slug: SlugFieldDiff,
  string: StringFieldDiff,
  url: UrlFieldDiff,
}
