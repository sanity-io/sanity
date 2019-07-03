const prettifyQuotaError = require('../../util/prettifyQuotaError')

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

export default {
  name: 'invite',
  group: 'users',
  signature: '[EMAIL]',
  helpText,
  description: 'Invite a new user to the project',
  action: async (args, context) => {
    const {apiClient, output, prompt} = context
    const [selectedEmail] = args.argsWithoutOptions
    const flags = args.extOptions

    const client = apiClient()
    const {projectId} = client.config()
    const roles = await client.request({uri: '/roles'})
    const email = selectedEmail || (await promptForEmail(prompt))
    const selectedRole = flags.role || (await promptForRole(prompt, roles))
    const role = roles.find(({id}) => id.toLowerCase() === selectedRole.toLowerCase())
    if (!role) {
      throw new Error(`Role name "${selectedRole}" not found`)
    }

    await client
      .clone()
      .config({useProjectHostname: false})
      .request({
        method: 'POST',
        uri: `/invitations/project/${projectId}`,
        body: {email, role: role.id},
        useGlobalApi: true,
        maxRedirects: 0
      })
      .catch(
        prettifyQuotaError(
          'Project is already at user quota, add billing details to the project in order to allow overage charges.'
        )
      )

    output.print(`Invitation sent to ${email}`)
  }
}

function promptForEmail(prompt) {
  return prompt.single({
    type: 'input',
    message: 'Email to invite:',
    filter: val => val.trim(),
    validate: name => {
      if (!name || !name.includes('@')) {
        return 'Invalid email'
      }

      return true
    }
  })
}

function promptForRole(prompt, roles) {
  return prompt.single({
    type: 'list',
    message: 'Which role should the user have?',
    choices: roles.map(role => ({
      value: role.id,
      name: `${role.name} (${role.description})`
    }))
  })
}
