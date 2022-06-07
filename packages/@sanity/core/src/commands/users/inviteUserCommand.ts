import type {CliCommandDefinition, CliPrompter} from '@sanity/cli'
import {prettifyQuotaError} from '../../util/prettifyQuotaError'
import type {Role} from './types'

const helpText = `
Options
  --role Role to invite the user as

Examples
  # Invite a new user to the project (prompt for details)
  sanity users invite

  # Send a new user invite to the email "pippi@sanity.io", prompt for role
  sanity users invite pippi@sanity.io

  # Send a new user invite to the email "pippi@sanity.io", as administrator
  sanity users invite pippi@sanity.io --role administrator
`

interface InviteFlags {
  role?: string
}

const inviteUserCommand: CliCommandDefinition<InviteFlags> = {
  name: 'invite',
  group: 'users',
  signature: '[EMAIL]',
  helpText,
  description: 'Invite a new user to the project',
  action: async (args, context) => {
    const {apiClient, output, prompt} = context
    const [selectedEmail] = args.argsWithoutOptions
    const flags = args.extOptions

    const client = apiClient().clone().config({useProjectHostname: false, apiVersion: '2021-06-07'})
    const {projectId} = client.config()
    const roles = (await client.request<Role[]>({uri: `/projects/${projectId}/roles`})).filter(
      (role) => role.appliesToUsers
    )
    const email = selectedEmail || (await promptForEmail(prompt))
    const selectedRole = flags.role || (await promptForRole(prompt, roles))
    const role = roles.find(({name}) => name.toLowerCase() === selectedRole.toLowerCase())
    if (!role) {
      throw new Error(`Role name "${selectedRole}" not found`)
    }

    await client
      .clone()
      .request({
        method: 'POST',
        uri: `/invitations/project/${projectId}`,
        body: {email, role: role.name},
        useGlobalApi: true,
        maxRedirects: 0,
      })
      .catch(
        prettifyQuotaError(
          'Project is already at user quota, add billing details to the project in order to allow overage charges.'
        )
      )

    output.print(`Invitation sent to ${email}`)
  },
}

export default inviteUserCommand

function promptForEmail(prompt: CliPrompter): Promise<string> {
  return prompt.single({
    type: 'input',
    message: 'Email to invite:',
    filter: (val) => val.trim(),
    validate: (name) => {
      if (!name || !name.includes('@')) {
        return 'Invalid email'
      }

      return true
    },
  })
}

function promptForRole(prompt: CliPrompter, roles: Role[]): Promise<string> {
  return prompt.single({
    type: 'list',
    message: 'Which role should the user have?',
    choices: roles.map((role) => ({
      value: role.name,
      name: `${role.title} (${role.description})`,
    })),
  })
}
