import {debug} from '../../debug'
import {type CliCommandArguments, type CliCommandContext} from '../../types'
import {fetchTokens, selectProject} from './tokenUtils'

export async function deleteToken(
  args: CliCommandArguments,
  context: CliCommandContext,
): Promise<void> {
  const {output, cliConfig, prompt, apiClient} = context
  const {print} = output
  const client = apiClient({requireUser: true, requireProject: false})

  const projectId = cliConfig?.api?.projectId || (await selectProject(client, prompt))
  let tokenId = args.argsWithoutOptions[0]

  if (!tokenId) {
    const tokens = await fetchTokens(client, projectId)

    if (tokens.length === 0) {
      print('No tokens found in project')
      return
    }

    tokens.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    debug('No token ID provided, showing list of choices')
    const tokenChoices = tokens.map((token) => ({
      value: token.id,
      name: `${token.label} (created ${new Date(token.createdAt).toLocaleString()})`,
    }))

    tokenId = await prompt.single({
      message: 'Select token to delete',
      type: 'list',
      choices: tokenChoices,
    })
  }

  const confirm = await prompt.single({
    message: 'Are you sure you want to delete this token?',
    type: 'confirm',
  })

  if (!confirm) {
    print('Token deletion cancelled')
    return
  }

  debug('Deleting token:', tokenId)
  await client.config({apiVersion: 'v2021-06-07'}).request({
    uri: `/projects/${projectId}/tokens/${tokenId}`,
    method: 'DELETE',
  })

  print('Token deleted successfully')
}
