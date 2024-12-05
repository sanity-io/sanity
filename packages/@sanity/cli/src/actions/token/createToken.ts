import {randomBytes} from 'node:crypto'

import {debug} from '../../debug'
import {type CliCommandArguments, type CliCommandContext} from '../../types'
import {API_VERSION, fetchRoles, selectProject} from './tokenUtils'

export async function createToken(
  args: CliCommandArguments,
  context: CliCommandContext,
): Promise<void> {
  const {output, cliConfig, prompt, apiClient} = context
  const {print} = output
  const client = apiClient({requireUser: true, requireProject: false})

  const projectId = cliConfig?.api?.projectId || (await selectProject(client, prompt))
  const roles = await fetchRoles(client, projectId)

  debug('Filtering roles that apply to robots')
  const robotRoles = roles.filter((role) => role.appliesToRobots)
  const roleChoices = robotRoles.map((role) => ({
    value: role.name,
    name: `${role.title} (${role.name})`,
  }))

  debug('Prompting for token role')
  const roleName = await prompt.single({
    message: 'Choose access level for the token:',
    type: 'list',
    choices: roleChoices,
    default: 'viewer',
  })

  debug('Prompting for token label')
  const selectedRole = robotRoles.find((role) => role.name === roleName)
  const label = await prompt.single({
    message: 'Give this token a descriptive name:',
    type: 'input',
    default: `${selectedRole?.title} token (${randomBytes(2).toString('hex')})`,
  })

  debug('Creating token')
  const {key} = await client.config({apiVersion: API_VERSION}).request<{key: string}>({
    uri: `/projects/${projectId}/tokens`,
    method: 'POST',
    body: {label, roleName},
  })

  print("New token created. Make sure to copy it now - you won't see it again:")
  print('')
  print(key)
}
