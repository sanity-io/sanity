import {codeInput} from '@sanity/code-input'
import {createConfig} from 'sanity'
import {deskTool} from 'sanity/desk'

export default createConfig({
  dataset: 'test',
  plugins: [codeInput(), deskTool()],
  name: 'default',
  projectId: 'ppsg7ml5',
  title: 'Starter Studio',
})
