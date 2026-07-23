import config from '#config'

import {createRoot} from 'react-dom/client'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {Studio} from 'sanity'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {structureTool} from 'sanity/structure'

const configWithStructure = {
  ...config,
  plugins: [...(config.plugins || []), structureTool()],
}

const container = document.getElementById('container')
if (!container) throw new Error('Could not find `#container`')

const root = createRoot(container)

root.render(<Studio config={configWithStructure} />)
