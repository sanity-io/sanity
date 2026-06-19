import {type ComponentType} from 'react'

import {type FIXME} from '../../../FIXME'
import {UniversalArrayInput} from '../../inputs/arrays/UniversalArrayInput'
import {BooleanInput} from '../../inputs/BooleanInput'
import {DateInput, DateTimeInput} from '../../inputs/DateInputs'
import {EmailInput} from '../../inputs/EmailInput'
import {NumberInput} from '../../inputs/NumberInput/NumberInput'
import {ObjectInput} from '../../inputs/ObjectInput'
import {SlugInput} from '../../inputs/Slug/SlugInput'
import {StringInput} from '../../inputs/StringInput/StringInput'
import {TextInput} from '../../inputs/TextInput'
import {UrlInput} from '../../inputs/UrlInput'
import {StudioCrossDatasetReferenceInput} from '../inputs/crossDatasetReference/StudioCrossDatasetReferenceInput'
import {StudioGlobalDocumentReferenceInput} from '../inputs/globalDocumentReference/StudioGlobalDocumentReferenceInput'
import {StudioFileInputLazy} from '../inputs/StudioFileInputLazy'
import {StudioImageInputLazy} from '../inputs/StudioImageInputLazy'

export const defaultInputs: Record<string, ComponentType<FIXME>> = {
  document: ObjectInput,
  object: ObjectInput,
  array: UniversalArrayInput,
  boolean: BooleanInput,
  number: NumberInput,
  text: TextInput,
  email: EmailInput,
  datetime: DateTimeInput,
  date: DateInput,
  url: UrlInput,
  image: StudioImageInputLazy,
  file: StudioFileInputLazy,
  string: StringInput,
  slug: SlugInput,
  crossDatasetReference: StudioCrossDatasetReferenceInput,
  globalDocumentReference: StudioGlobalDocumentReferenceInput,
}
