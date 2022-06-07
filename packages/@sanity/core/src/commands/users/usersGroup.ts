import type {CliCommandGroupDefinition} from '@sanity/cli'

export const usersGroup: CliCommandGroupDefinition = {
  name: 'users',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Manage users of your project',
}

export default usersGroup
