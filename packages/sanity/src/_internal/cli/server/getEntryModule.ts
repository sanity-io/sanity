const entryModule = `
// This file is auto-generated on 'sanity dev'
// Modifications to this file is automatically discarded
import {renderStudio} from "sanity"
import studioConfig from %STUDIO_CONFIG_LOCATION%

renderStudio(
  document.getElementById("sanity"),
  studioConfig,
  %STUDIO_REACT_STRICT_MODE%
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
  %STUDIO_REACT_STRICT_MODE%
)
`

export function getEntryModule(options: {
  reactStrictMode: boolean
  relativeConfigLocation: string | null
}): string {
  const {reactStrictMode, relativeConfigLocation} = options
  const sourceModule = relativeConfigLocation ? entryModule : noConfigEntryModule

  return sourceModule
    .replace(/%STUDIO_REACT_STRICT_MODE%/, JSON.stringify(Boolean(reactStrictMode)))
    .replace(/%STUDIO_CONFIG_LOCATION%/, JSON.stringify(relativeConfigLocation))
}
