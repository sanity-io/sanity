import React from 'react'
import {BooleanInput} from '../../inputs/BooleanInput'
import {EmailInput} from '../../inputs/EmailInput'
import {NumberInput} from '../../inputs/NumberInput'
import {ObjectInput} from '../../inputs/ObjectInput'
import {StringInput} from '../../inputs/StringInput'
import {DateInput, DateTimeInput} from '../../inputs/DateInputs'
import {TextInput} from '../../inputs/TextInput'
import {UrlInput} from '../../inputs/UrlInput'
import {SlugInput} from '../../inputs/Slug/SlugInput'
import {StudioImageInput} from '../inputs/StudioImageInput'
import {StudioFileInput} from '../inputs/StudioFileInput'
import {StudioCrossDatasetReferenceInput} from '../inputs/crossDatasetReference/StudioCrossDatasetReferenceInput'
import {UniversalArrayInput} from '../../inputs/arrays/UniversalArrayInput'
import {FIXME} from '../../../FIXME'

export const defaultInputs: Record<string, React.ComponentType<FIXME>> = {
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
  image: StudioImageInput,
  file: StudioFileInput,
  string: StringInput,
  slug: SlugInput,
  crossDatasetReference: StudioCrossDatasetReferenceInput,
}
