import { defineType } from 'sanity'
import PlaceholderStringInput from '../../../components/inputs/PlaceholderString'

export const placeholderStringType = defineType({
  name: 'placeholderString',
  title: 'Title',
  type: 'string',
  components: {
    input: PlaceholderStringInput,
  },
}
)