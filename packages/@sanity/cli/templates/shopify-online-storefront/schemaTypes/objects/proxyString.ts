import {defineType} from 'sanity'
import ProxyStringInput from '../../components/inputs/ProxyString'

export default defineType({
  name: 'proxyString',
  title: 'Title',
  type: 'string',
  components: {
    input: ProxyStringInput,
  },
})
