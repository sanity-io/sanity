const entryModule = `
// This file is auto-generated on 'sanity dev'
// Modifications to this file is automatically discarded
import {renderStudio} from "sanity"
import studioConfig from %STUDIO_CONFIG_LOCATION%

renderStudio(
  document.getElementById("sanity"),
  studioConfig,
  {reactStrictMode: %STUDIO_REACT_STRICT_MODE%, basePath: %STUDIO_BASE_PATH%}
)
`

const noConfigEntryModule = `
// This file is auto-generated on 'sanity dev'
// Modifications to this file is automatically discarded
import {renderStudio} from "sanity"

const studioConfig = {missingConfigFile: true}

renderStudio(
  document.getElementById("sanity"),
  studioConfig,
  {reactStrictMode: %STUDIO_REACT_STRICT_MODE%, basePath: %STUDIO_BASE_PATH%}
)
`

const appEntryModule = `
// This file is auto-generated on 'sanity dev'
// Modifications to this file is automatically discarded
import {createRoot} from 'react-dom/client'
import {createElement} from 'react'
import App from %APP_LOCATION%

const root = createRoot(document.getElementById('root'))
const element = createElement(App)
root.render(element)
`

export function getEntryModule(options: {
  reactStrictMode: boolean
  relativeConfigLocation: string | null
  basePath?: string
  appLocation?: string
  isApp?: boolean
}): string {
  const {reactStrictMode, relativeConfigLocation, basePath, appLocation, isApp} = options

  if (isApp) {
    return appEntryModule.replace(/%APP_LOCATION%/, JSON.stringify(appLocation || './src/App'))
  }

  const sourceModule = relativeConfigLocation ? entryModule : noConfigEntryModule

  return sourceModule
    .replace(/%STUDIO_REACT_STRICT_MODE%/, JSON.stringify(Boolean(reactStrictMode)))
    .replace(/%STUDIO_CONFIG_LOCATION%/, JSON.stringify(relativeConfigLocation))
    .replace(/%STUDIO_BASE_PATH%/, JSON.stringify(basePath || '/'))
}
