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

export function getEntryModule(options: {
  reactStrictMode: boolean
  relativeConfigLocation: string
}): string {
  return entryModule
    .replace(/%STUDIO_REACT_STRICT_MODE%/, JSON.stringify(Boolean(options.reactStrictMode)))
    .replace(/%STUDIO_CONFIG_LOCATION%/, JSON.stringify(options.relativeConfigLocation))
}
