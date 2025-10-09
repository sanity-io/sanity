import {defineType} from 'sanity'

import {ExternalSourceInput} from './components/ExternalSourceInput'

export const source = defineType({
  name: 'source',
  type: 'string',
  title: 'External Source',
  components: {
    input: ExternalSourceInput,
  },
})
