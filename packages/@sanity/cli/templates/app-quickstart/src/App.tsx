import {type SanityConfig} from '@sanity/sdk'
import {SanityApp} from '@sanity/sdk-react'
import {ExampleComponent} from './ExampleComponent'
import './App.css'

function App() {
  // apps can access many different projects or other sources of data
  const sanityConfigs: SanityConfig[] = [
    {
      projectId: '',
      dataset: '',
    }
  ]

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
