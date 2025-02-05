import {createSanityInstance} from '@sanity/sdk'
import {SanityProvider} from '@sanity/sdk-react/context'

export function App() {

  const sanityConfig = {
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

  const sanityInstance = createSanityInstance(sanityConfig)
  return (
    <SanityProvider sanityInstance={sanityInstance}>
      Hello world!
    </SanityProvider>
  )
}

export default App