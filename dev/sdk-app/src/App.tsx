// oxlint-disable-next-line no-unassigned-import
import './App.css'

import {type SanityConfig} from '@sanity/sdk'
import {SanityApp} from '@sanity/sdk-react'

import {ExampleComponent} from './ExampleComponent'

const sanityConfigs: SanityConfig[] = [
  {
    projectId: 'ppsg7ml5',
    dataset: 'app',
  },
]

function App() {
  return (
    <div className="app-container">
      <SanityApp config={sanityConfigs} fallback={<div>Loading...</div>}>
        {/* add your own components here! */}
        <ExampleComponent />
      </SanityApp>
    </div>
  )
}

export default App
