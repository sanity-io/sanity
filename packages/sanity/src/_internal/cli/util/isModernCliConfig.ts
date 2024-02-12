import {type CliCommandContext, type CliV3CommandContext} from '@sanity/cli'

export function isModernCliConfig(config: CliCommandContext): config is CliV3CommandContext {
  return config.sanityMajorVersion >= 3
}
