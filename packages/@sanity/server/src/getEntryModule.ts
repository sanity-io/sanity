const entryModule = `
// This file is auto-generated on 'sanity start'
// Modifications to this file is automatically discarded
import {renderStudio} from "sanity"
import studioConfig from %STUDIO_CONFIG_LOCATION%

renderStudio(
  document.getElementById("sanity"),
  studioConfig
)
`

export function getEntryModule(options: {relativeConfigLocation: string}): string {
  return entryModule.replace(
    /%STUDIO_CONFIG_LOCATION%/,
    JSON.stringify(options.relativeConfigLocation)
  )
}
