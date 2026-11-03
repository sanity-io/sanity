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

type DefaultDiffComponent = DiffComponent<any> | DiffComponentOptions<any> | undefined

function createDefaultComponents(): Record<string, DefaultDiffComponent> {
  return {
    block: PTDiff,
    boolean: {component: BooleanFieldDiff, showHeader: false},
    date: DatetimeFieldDiff,
    datetime: DatetimeFieldDiff,
    file: FileFieldDiff,
    image: ImageFieldDiff,
    number: NumberFieldDiff,
    reference: ReferenceFieldDiff,
    crossDatasetReference: ReferenceFieldDiff,
    slug: SlugFieldDiff,
    string: StringFieldDiff,
  }
}

// Built on first lookup: PTDiff, ImageFieldDiff and FileFieldDiff import ChangeList, which imports this module back.
let defaultComponentsByName: Record<string, DefaultDiffComponent> | undefined

export function getDefaultDiffComponent(name: string): DefaultDiffComponent {
  defaultComponentsByName ??= createDefaultComponents()
  return defaultComponentsByName[name]
}
