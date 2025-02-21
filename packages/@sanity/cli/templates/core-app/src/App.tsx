import {type SanityConfig} from '@sanity/sdk'
import {SanityApp} from '@sanity/sdk-react/components'
import {ExampleComponent} from './ExampleComponent'

export function App() {

  const sanityConfig: SanityConfig = {
    auth: {
      authScope: 'global'
    }
    /* 
     * Apps can access several different projects!
     * Add the below configuration if you want to connect to a specific project.
     */
    // projectId: 'my-project-id',
    // dataset: 'my-dataset',
  }

  return (
    <SanityApp sanityConfig={sanityConfig}>
      {/* add your own components here! */}
      <ExampleComponent />
    </SanityApp>
  )
}

export default App