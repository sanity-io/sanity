import {createConfig} from 'sanity'
import {MyLogo} from './components/MyLogo'
import {schema} from './schema'

export default createConfig({
  name: 'default', // @todo remove
  projectId: 'aeysrmym',
  dataset: 'production',
  logo: MyLogo,
  schema,
})
