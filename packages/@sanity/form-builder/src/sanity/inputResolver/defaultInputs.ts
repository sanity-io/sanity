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
import {FormBuilderContextValue} from '../../FormBuilderContext'
import SanityCrossDatasetReferenceInput from '../inputs/crossDatasetReference/SanityCrossDatasetReferenceInput'

export const sanityInputs: FormBuilderContextValue['components']['inputs'] = {
  object: ObjectInput,
  array: SanityArrayInput,
  boolean: BooleanInput,
  number: NumberInput,
  text: TextInput,
  email: EmailInput,
  datetime: DateTimeInput,
  date: DateInput,
  url: UrlInput,
  image: SanityImageInput,
  file: SanityFileInput,
  string: StringInput,
  slug: SlugInput,

  crossDatasetReference: SanityCrossDatasetReferenceInput,
}
