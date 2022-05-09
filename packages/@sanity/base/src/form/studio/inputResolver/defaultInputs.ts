import React from 'react'
import {BooleanInput} from '../../inputs/BooleanInput'
import {EmailInput} from '../../inputs/EmailInput'
import {NumberInput} from '../../inputs/NumberInput'
import {ObjectInput} from '../../inputs/ObjectInput'
import {StringInput} from '../../inputs/StringInput'
import {DateTimeInput, DateInput} from '../../inputs/DateInputs'
import {TextInput} from '../../inputs/TextInput'
import {UrlInput} from '../../inputs/UrlInput'
import {SlugInput} from '../../inputs/Slug/SlugInput'
import {StudioArrayInput} from '../inputs/StudioArrayInput'
import {StudioImageInput} from '../inputs/StudioImageInput'
import {StudioFileInput} from '../inputs/StudioFileInput'
import {StudioCrossDatasetReferenceInput} from '../inputs/crossDatasetReference/StudioCrossDatasetReferenceInput'
import {FIXME} from '../../types'

export const defaultInputs: Record<string, React.ComponentType<FIXME>> = {
  document: ObjectInput,
  object: ObjectInput,
  array: StudioArrayInput,
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
