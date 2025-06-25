import {type CliCommandContext, type CliPrompter} from '@sanity/cli'
import {type TokenResponse, type ProjectRole} from '../../commands/tokens/types'

interface AddTokenFlags {
  role?: string
}

export async function addToken(
  givenLabel: string,
  flags: AddTokenFlags,
  context: CliCommandContext,
): Promise<TokenResponse> {
  const {apiClient, prompt, output} = context
  const client = apiClient({requireUser: true, requireProject: true})

  const label = givenLabel || (await promptForLabel(prompt))
  const roleName = await (flags.role ? validateRole(flags.role, context) : promptForRole(context))

  const response = await client.request<TokenResponse>({
    method: 'POST',
    url: '/tokens',
    body: {label, roleName},
  })

  return response
}

async function promptForLabel(prompt: CliPrompter): Promise<string> {
  return prompt.single({
    type: 'input',
    message: 'Token label:',
    validate: (input) => (input && input.trim() ? true : 'Label cannot be empty'),
  })
}

async function promptForRole(context: CliCommandContext): Promise<string> {
  const {apiClient, prompt} = context
  const client = apiClient({requireUser: true, requireProject: true})

  const roles = await client.request<ProjectRole[]>({url: '/roles'})
  const robotRoles = roles.filter((role) => role.appliesToRobots)

  if (robotRoles.length === 0) {
    throw new Error('No roles available for tokens')
  }

  const choices = robotRoles.map((role) => ({
    name: `${role.title} (${role.name})`,
    value: role.name,
    short: role.title,
  }))

  return prompt.single({
    type: 'list',
    message: 'Select role for the token:',
    choices,
    default: 'editor',
  })
}

async function validateRole(roleName: string, context: CliCommandContext): Promise<string> {
  const {apiClient} = context
  const client = apiClient({requireUser: true, requireProject: true})

  const roles = await client.request<ProjectRole[]>({url: '/roles'})
  const robotRoles = roles.filter((role) => role.appliesToRobots)

  const role = robotRoles.find((r) => r.name === roleName)
  if (!role) {
    const availableRoles = robotRoles.map((r) => r.name).join(', ')
    throw new Error(`Invalid role "${roleName}". Available roles: ${availableRoles}`)
  }

  return roleName
}
