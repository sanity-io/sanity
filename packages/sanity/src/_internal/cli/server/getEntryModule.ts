/**
 * The import order here is significant.
 * The `import studioConfig from %STUDIO_CONFIG_LOCATION%` line should always come first,
 * otherwise it's impossible to setup tooling like React Scan which requires userland to import a dependency
 * _before_ any `import from 'react'` happens.
 */
const entryModule = `
// This file is auto-generated on 'sanity dev'
// Modifications to this file are automatically discarded
import studioConfig from %STUDIO_CONFIG_LOCATION%
import {renderStudio} from "sanity"

renderStudio(
  document.getElementById("sanity"),
  studioConfig,
  {reactStrictMode: %STUDIO_REACT_STRICT_MODE%, basePath: %STUDIO_BASE_PATH%, localApplications: [{port: %STUDIO_PORT%, title: 'Sanity Studio', remoteEntryUrl: 'http://localhost:%STUDIO_PORT%/static/remoteEntry.js'}]}
)
`

const noConfigEntryModule = `
// This file is auto-generated on 'sanity dev'
// Modifications to this file are automatically discarded
import {renderStudio} from "sanity"

const studioConfig = {missingConfigFile: true}

renderStudio(
  document.getElementById("sanity"),
  studioConfig,
  {reactStrictMode: %STUDIO_REACT_STRICT_MODE%, basePath: %STUDIO_BASE_PATH%, localApplications: [{port: %STUDIO_PORT%, title: 'Sanity Studio', remoteEntryUrl: 'http://localhost:%STUDIO_PORT%/static/remoteEntry.js'}]}
)
`

const appEntryModule = `
// This file is auto-generated on 'sanity dev'
// Modifications to this file are automatically discarded
import {createRoot} from 'react-dom/client'
import {createElement} from 'react'
import App from %ENTRY%

const root = createRoot(document.getElementById('root'))
const element = createElement(App)
root.render(element)
`

interface EntryModuleOptions {
  reactStrictMode: boolean
  relativeConfigLocation: string | null
  basePath?: string
  entry?: string
  isApp?: boolean
}

export function getEntryModule(options: EntryModuleOptions): string {
  const {reactStrictMode, relativeConfigLocation, basePath, entry, isApp} = options

  if (isApp) {
    return appEntryModule.replace(/%ENTRY%/, JSON.stringify(entry || './src/App'))
  }

  const sourceModule = relativeConfigLocation ? entryModule : noConfigEntryModule

  return sourceModule
    .replace(/%STUDIO_REACT_STRICT_MODE%/, JSON.stringify(Boolean(reactStrictMode)))
    .replace(/%STUDIO_CONFIG_LOCATION%/, JSON.stringify(relativeConfigLocation))
    .replace(/%STUDIO_BASE_PATH%/, JSON.stringify(basePath || '/'))
    .replace(/%STUDIO_PORT%/g, JSON.stringify(3333))
}

export function getFederationModule(options: EntryModuleOptions): string {
  const src = `
// This file is auto-generated on 'sanity dev'
// Modifications to this file are automatically discarded
import {StrictMode} from 'react'
import studioConfig from %STUDIO_CONFIG_LOCATION%
import {Studio} from 'sanity'

const App = (props) => {
  if(%STUDIO_REACT_STRICT_MODE%){
    return <StrictMode>
      <Studio config={studioConfig} basePath="/studio/3334" {...props} unstable_globalStyles />
    </StrictMode>
  }
    
  return <Studio config={studioConfig} {...props} unstable_globalStyles />
}

export default App
`
    .replace(/%STUDIO_REACT_STRICT_MODE%/, JSON.stringify(Boolean(options.reactStrictMode)))
    .replace(/%STUDIO_CONFIG_LOCATION%/, JSON.stringify(options.relativeConfigLocation))

  return src
}
