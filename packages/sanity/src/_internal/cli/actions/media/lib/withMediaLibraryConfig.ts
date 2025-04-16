import type {CliCommandContext, CliConfig} from '@sanity/cli'
import path from 'node:path'

export function withMediaLibraryConfig(
  context: CliCommandContext,
): CliCommandContext & Required<Pick<CliConfig, 'mediaLibrary'>> {
  const {cliConfig, cliConfigPath} = context

  const mediaLibrary =
    typeof cliConfig === 'object' && 'mediaLibrary' in cliConfig
      ? cliConfig.mediaLibrary
      : undefined

  const relativeConfigPath = path.relative(process.cwd(), cliConfigPath ?? '')

  if (typeof mediaLibrary?.aspectsPath === 'undefined') {
    throw new Error(
      `${relativeConfigPath} does not contain a media library aspects path ("mediaLibrary.aspectsPath"), ` +
        'which is required for the Sanity CLI to manage aspects.',
    )
  }

  return {
    ...context,
    mediaLibrary,
  }
}
