import type {CliCommandDefinition, CliCommandGroupDefinition} from '../types'

export function isCommandGroup(
  cmdOrGroup: CliCommandDefinition | CliCommandGroupDefinition
): cmdOrGroup is CliCommandGroupDefinition {
  return 'isGroupRoot' in cmdOrGroup
}
