import {createRoot} from 'react-dom/client'
import {Studio} from 'sanity'
import {structureTool} from 'sanity/structure'

import config from '#config'

const configWithStructure = {
  ...config,
  plugins: [...(config.plugins || []), structureTool()],
}

const container = document.getElementById('container')
if (!container) throw new Error('Could not find `#container`')

const root = createRoot(container)

root.render(<Studio config={configWithStructure} />)
