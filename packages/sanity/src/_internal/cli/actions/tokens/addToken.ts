import {type CliCommandContext, type CliPrompter} from '@sanity/cli'

import {type ProjectRole, type TokenResponse} from '../../commands/tokens/types'
import {isInteractive} from '../../util/isInteractive'

interface AddTokenFlags {
  role?: string
  unattended?: boolean
}

export async function addToken(
  givenLabel: string,
  flags: AddTokenFlags,
  context: CliCommandContext,
): Promise<TokenResponse> {
  const {apiClient, prompt, output} = context
  const client = apiClient({requireUser: true, requireProject: true}).config({
    apiVersion: '2021-06-07',
  })

  const label = givenLabel || (await promptForLabel(prompt, flags.unattended))
  const roleName = await (flags.role
    ? validateRole(flags.role, context)
    : promptForRole(context, flags.unattended))

  const {projectId} = client.config()
  const response = await client.request<TokenResponse>({
    method: 'POST',
    url: `/projects/${projectId}/tokens`,
    body: {label, roleName},
  })

  return response
}

async function promptForLabel(prompt: CliPrompter, unattended?: boolean): Promise<string> {
  if (unattended || !isInteractive) {
    throw new Error(
      'Token label is required in non-interactive mode. Provide a label as an argument.',
    )
  }

  return prompt.single({
    type: 'input',
    message: 'Token label:',
    validate: (input) => (input && input.trim() ? true : 'Label cannot be empty'),
  })
}

async function promptForRole(context: CliCommandContext, unattended?: boolean): Promise<string> {
  if (unattended || !isInteractive) {
    return 'viewer' // Default role for unattended mode
  }

  const {apiClient, prompt} = context
  const client = apiClient({requireUser: true, requireProject: true}).config({
    apiVersion: '2021-06-07',
  })

  const {projectId} = client.config()
  const roles = await client.request<ProjectRole[]>({url: `/projects/${projectId}/roles`})
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
    default: 'viewer',
  })
}

async function validateRole(roleName: string, context: CliCommandContext): Promise<string> {
  const {apiClient} = context
  const client = apiClient({requireUser: true, requireProject: true}).config({
    apiVersion: '2021-06-07',
  })

  const {projectId} = client.config()
  const roles = await client.request<ProjectRole[]>({url: `/projects/${projectId}/roles`})
  const robotRoles = roles.filter((role) => role.appliesToRobots)

  const role = robotRoles.find((r) => r.name === roleName)
  if (!role) {
    const availableRoles = robotRoles.map((r) => r.name).join(', ')
    throw new Error(`Invalid role "${roleName}". Available roles: ${availableRoles}`)
  }

  return roleName
}
