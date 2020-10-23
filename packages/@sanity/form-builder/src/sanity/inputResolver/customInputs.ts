// These are inputs that may be implemented by provided parts
import BooleanInput from 'part:@sanity/form-builder/input/boolean?'
import DateTimeInput from 'part:@sanity/form-builder/input/datetime?'
import EmailInput from 'part:@sanity/form-builder/input/email?'
import GeoPointInput from 'part:@sanity/form-builder/input/geopoint?'
import NumberInput from 'part:@sanity/form-builder/input/number?'
import ObjectInput from 'part:@sanity/form-builder/input/object?'
import ReferenceInput from 'part:@sanity/form-builder/input/reference?'
import RichDateInput from 'part:@sanity/form-builder/input/rich-date?'
import StringInput from 'part:@sanity/form-builder/input/string?'
import TextInput from 'part:@sanity/form-builder/input/text?'
import UrlInput from 'part:@sanity/form-builder/input/url?'

export default {
  object: ObjectInput,
  boolean: BooleanInput,
  number: NumberInput,
  string: StringInput,
  text: TextInput,
  reference: ReferenceInput,
  datetime: DateTimeInput,
  richDate: RichDateInput,
  email: EmailInput,
  geopoint: GeoPointInput,
  url: UrlInput,
}
