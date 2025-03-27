/**
 * The import order here is significant.
 * The `import studioConfig from %STUDIO_CONFIG_LOCATION%` line should always come first,
 * otherwise it's impossible to setup tooling like React Scan which requires userland to import a dependency
 * _before_ any `import from 'react'` happens.
 */
const entryModule = `
// This file is auto-generated on 'sanity dev'
// Modifications to this file are automatically discarded

import '@sanity/ui/css/index.css'

import studioConfig from %STUDIO_CONFIG_LOCATION%
import {renderStudio} from "sanity"

renderStudio(
  document.getElementById("sanity"),
  studioConfig,
  {reactStrictMode: %STUDIO_REACT_STRICT_MODE%, basePath: %STUDIO_BASE_PATH%}
)
`

const noConfigEntryModule = `
// This file is auto-generated on 'sanity dev'
// Modifications to this file are automatically discarded

import '@sanity/ui/css/index.css'

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
// Modifications to this file are automatically discarded

import {createRoot} from 'react-dom/client'
import {createElement} from 'react'
import App from %ENTRY%

const root = createRoot(document.getElementById('root'))
const element = createElement(App)
root.render(element)
`

export function getEntryModule(options: {
  reactStrictMode: boolean
  relativeConfigLocation: string | null
  basePath?: string
  entry?: string
  isApp?: boolean
}): string {
  const {reactStrictMode, relativeConfigLocation, basePath, entry, isApp} = options

  if (isApp) {
    return appEntryModule.replace(/%ENTRY%/, JSON.stringify(entry || './src/App'))
  }

  const sourceModule = relativeConfigLocation ? entryModule : noConfigEntryModule

  return sourceModule
    .replace(/%STUDIO_REACT_STRICT_MODE%/, JSON.stringify(Boolean(reactStrictMode)))
    .replace(/%STUDIO_CONFIG_LOCATION%/, JSON.stringify(relativeConfigLocation))
    .replace(/%STUDIO_BASE_PATH%/, JSON.stringify(basePath || '/'))
}
