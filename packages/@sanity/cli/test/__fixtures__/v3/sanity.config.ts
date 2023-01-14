import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {MyLogo} from './components/MyLogo'
import {schema} from './schema'

export default defineConfig({
  projectId: 'aeysrmym',
  dataset: 'production',
  plugins: [deskTool()],
  logo: MyLogo,
  schema,
})
