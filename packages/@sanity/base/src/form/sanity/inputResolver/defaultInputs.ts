import {BooleanInput} from '../../inputs/BooleanInput'
import {EmailInput} from '../../inputs/EmailInput'
import {NumberInput} from '../../inputs/NumberInput'
import {ObjectInput} from '../../inputs/ObjectInput'
import {StringInput} from '../../inputs/StringInput'
import {DateTimeInput, DateInput} from '../../inputs/DateInputs'
import {TextInput} from '../../inputs/TextInput'
import {UrlInput} from '../../inputs/UrlInput'
import {SlugInput} from '../../inputs/Slug/SlugInput'
import {SanityArrayInput} from '../inputs/SanityArrayInput'
import {SanityImageInput} from '../inputs/SanityImageInput'
import {SanityFileInput} from '../inputs/SanityFileInput'
import SanityCrossDatasetReferenceInput from '../inputs/crossDatasetReference/SanityCrossDatasetReferenceInput'
import {FieldProps} from '../../store/types'
import {FIXME} from '../../types'

export const sanityInputs: Record<string, {input: React.ComponentType<FieldProps>}> = {
  object: {input: ObjectInput},
  array: {input: SanityArrayInput as FIXME},
  boolean: {input: BooleanInput as FIXME},
  number: {input: NumberInput as FIXME},
  text: {input: TextInput as FIXME},
  email: {input: EmailInput as FIXME},
  datetime: {input: DateTimeInput as FIXME},
  date: {input: DateInput} as FIXME,
  url: {input: UrlInput as FIXME},
  image: {input: SanityImageInput as FIXME},
  file: {input: SanityFileInput as FIXME},
  string: {input: StringInput},
  slug: {input: SlugInput as FIXME},

  crossDatasetReference: {input: SanityCrossDatasetReferenceInput as FIXME},
}

export type SanityInputType = keyof typeof sanityInputs

export function isSanityInputType(typeName: string): typeName is SanityInputType {
  return SANITY_INPUT_KEYS.includes(typeName as SanityInputType)
}

export const SANITY_INPUT_KEYS = Object.keys(sanityInputs) as SanityInputType[]
