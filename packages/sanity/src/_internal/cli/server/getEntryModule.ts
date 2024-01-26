const entryModule = `
// This file is auto-generated on 'sanity dev'
// Modifications to this file is automatically discarded
import {renderStudio} from "sanity"
import studioConfig from %STUDIO_CONFIG_LOCATION%

renderStudio(
  document.getElementById("sanity"),
  studioConfig,
  {reactStrictMode: %STUDIO_REACT_STRICT_MODE%, warnUnknownForwardedProps: %STUDIO_WARN_UNKNOWN_FORWARDED_PROPS%, basePath: %STUDIO_BASE_PATH%}
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
  {reactStrictMode: %STUDIO_REACT_STRICT_MODE%, warnUnknownForwardedProps: %STUDIO_WARN_UNKNOWN_FORWARDED_PROPS%, basePath: %STUDIO_BASE_PATH%}
)
`

export function getEntryModule(options: {
  reactStrictMode: boolean
  warnUnknownForwardedProps: boolean
  relativeConfigLocation: string | null
  basePath?: string
}): string {
  const {reactStrictMode, warnUnknownForwardedProps, relativeConfigLocation, basePath} = options
  const sourceModule = relativeConfigLocation ? entryModule : noConfigEntryModule

  return sourceModule
    .replace(/%STUDIO_REACT_STRICT_MODE%/, JSON.stringify(Boolean(reactStrictMode)))
    .replace(
      /%STUDIO_WARN_UNKNOWN_FORWARDED_PROPS%/,
      JSON.stringify(Boolean(warnUnknownForwardedProps)),
    )
    .replace(/%STUDIO_CONFIG_LOCATION%/, JSON.stringify(relativeConfigLocation))
    .replace(/%STUDIO_BASE_PATH%/, JSON.stringify(basePath || '/'))
}
