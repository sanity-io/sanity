
import BooleanInput from '../../inputs/Boolean'
import EmailInput from '../../inputs/Email'
import NumberInput from '../../inputs/Number'
import ObjectInput from '../../inputs/Object'
import StringInput from '../../inputs/String'
import TextInput from '../../inputs/Text'
import UrlInput from '../../inputs/Url'

import SanityArrayInput from '../inputs/SanityArray'
import Image from '../inputs/Image'
import File from '../inputs/File'
import Slug from '../inputs/Slug'

export default {
  object: ObjectInput,
  array: SanityArrayInput,
  boolean: BooleanInput,
  number: NumberInput,
  text: TextInput,
  email: EmailInput,
  url: UrlInput,
  image: Image,
  file: File,
  string: StringInput,
  slug: Slug
}
