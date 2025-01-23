import {SanityApp} from '@sanity/sdk-react/components'

export function App() {

  const sanityConfig = {
    /* 
     * CORE apps can access several different projects!
     * Add the below configuration if you want to connect to a specific project.
     */
    // projectId: 'my-project-id',
    // dataset: 'my-dataset',
    auth: {
      authScope: 'org'
    }
  }
  return (
    <SanityApp sanityConfig={sanityConfig}>
      Hello world!
    </SanityApp>
  )
}

export default App