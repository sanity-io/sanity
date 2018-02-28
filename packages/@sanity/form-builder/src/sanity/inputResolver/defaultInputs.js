import BooleanInput from '../../inputs/BooleanInput'
import EmailInput from '../../inputs/EmailInput'
import NumberInput from '../../inputs/NumberInput'
import ObjectInput from '../../inputs/ObjectInput'
import StringInput from '../../inputs/StringInput'
import DateTimeInput from '../../inputs/DateTimeInput'
import TextInput from '../../inputs/TextInput'
import UrlInput from '../../inputs/UrlInput'
import SlugInput from '../../inputs/Slug/SlugInput'

import SanityArrayInput from '../inputs/SanityArrayInput'
import Image from '../inputs/SanityImageInput'
import File from '../inputs/SanityFileInput'

export default {
  object: ObjectInput,
  array: SanityArrayInput,
  boolean: BooleanInput,
  number: NumberInput,
  text: TextInput,
  email: EmailInput,
  datetime: DateTimeInput,
  url: UrlInput,
  image: Image,
  file: File,
  string: StringInput,
  slug: SlugInput
}
