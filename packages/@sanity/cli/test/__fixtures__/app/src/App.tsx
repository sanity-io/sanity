import {type SanityConfig} from '@sanity/sdk'
import {SanityApp} from '@sanity/sdk-react'

export function App() {
  // apps can access many different projects or other sources of data
  const sanityConfigs: SanityConfig[] = [
    {
      projectId: 'project-id',
      dataset: 'dataset-name',
    },
  ]

  return (
    <div className="app-container">
      <SanityApp sanityConfigs={sanityConfigs} fallback={<div>Loading...</div>} />
    </div>
  )
}

export default App
