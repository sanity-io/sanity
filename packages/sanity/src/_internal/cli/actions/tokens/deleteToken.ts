import {type CliCommandContext} from '@sanity/cli'

import {type Token} from '../../commands/tokens/types'
import {isInteractive} from '../../util/isInteractive'

interface DeleteTokenFlags {
  unattended?: boolean
}

export async function deleteToken(
  specifiedToken: string,
  flags: DeleteTokenFlags,
  context: CliCommandContext,
): Promise<boolean> {
  const {apiClient} = context
  const client = apiClient({requireUser: true, requireProject: true}).config({
    apiVersion: '2021-06-07',
  })

  const tokenId = await promptForToken(specifiedToken, context, flags.unattended)

  if (!(await confirmDeletion(tokenId, context, flags.unattended))) {
    return false
  }

  const config = client.config()
  try {
    await client.request({
      method: 'DELETE',
      uri: `/projects/${config.projectId}/tokens/${tokenId}`,
    })
    return true
  } catch (err) {
    if (err.statusCode === 404) {
      throw new Error(`Token with ID "${tokenId}" not found`, {cause: err})
    }
    throw err
  }
}

async function promptForToken(
  specified: string | undefined,
  context: CliCommandContext,
  unattended?: boolean,
): Promise<string> {
  // If token ID is specified, just return it (validation happens during deletion)
  if (specified) {
    return specified
  }

  if (unattended || !isInteractive) {
    throw new Error(
      'Token ID is required in non-interactive mode. Provide a token ID as an argument.',
    )
  }

  // Only fetch tokens for interactive selection when no ID provided
  const {prompt, apiClient} = context
  const client = apiClient({requireUser: true, requireProject: true}).config({
    apiVersion: '2021-06-07',
  })

  const config = client.config()
  const tokens = await client.request<Token[]>({url: `/projects/${config.projectId}/tokens`})

  if (tokens.length === 0) {
    throw new Error('No tokens found')
  }

  const choices = tokens.map((token) => ({
    value: token.id,
    name: `${token.label} (${(token.roles || []).map((r) => r.title).join(', ')})`,
  }))

  return prompt.single({
    message: 'Select token to delete:',
    type: 'list',
    choices,
  })
}

async function confirmDeletion(
  tokenId: string,
  context: CliCommandContext,
  unattended?: boolean,
): Promise<boolean> {
  if (unattended || !isInteractive) {
    return true // Skip confirmation in unattended mode
  }

  const {prompt} = context

  return prompt.single({
    type: 'confirm',
    message: `Are you sure you want to delete the token with ID "${tokenId}"?`,
    default: false,
  })
}
