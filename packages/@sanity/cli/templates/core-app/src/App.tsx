import {type SanityConfig} from '@sanity/sdk'
import {SanityApp} from '@sanity/sdk-react/components'
import {ExampleComponent} from './ExampleComponent'
import './App.css'

export function App() {
  const sanityConfig: SanityConfig = {
    auth: {
      authScope: 'global'
    }
  }

  return (
    <div className="app-container">
      <SanityApp sanityConfig={sanityConfig}>
        {/* add your own components here! */}
        <ExampleComponent />
      </SanityApp>
    </div>
  )
}

export default App
