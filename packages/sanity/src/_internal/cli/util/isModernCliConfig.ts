import {CliV3CommandContext, type CliCommandContext} from '@sanity/cli'

export function isModernCliConfig(config: CliCommandContext): config is CliV3CommandContext {
  return config.sanityMajorVersion >= 3
}
