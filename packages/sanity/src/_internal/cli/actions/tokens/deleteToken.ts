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
  await client.request({
    method: 'DELETE',
    uri: `/projects/${config.projectId}/tokens/${tokenId}`,
  })

  return true
}

async function promptForToken(
  specified: string | undefined,
  context: CliCommandContext,
  unattended?: boolean,
): Promise<string> {
  const {prompt, apiClient} = context
  const client = apiClient({requireUser: true, requireProject: true}).config({
    apiVersion: '2021-06-07',
  })

  const config = client.config()
  const tokens = await client.request<Token[]>({url: `/projects/${config.projectId}/tokens`})

  if (tokens.length === 0) {
    throw new Error('No tokens found')
  }

  if (specified) {
    // Try to find by ID first
    let selected = tokens.find((token) => token.id === specified)

    // If not found by ID, try to find by label
    if (!selected) {
      selected = tokens.find((token) => token.label.toLowerCase() === specified.toLowerCase())
    }

    if (!selected) {
      throw new Error(`Token "${specified}" not found`)
    }

    return selected.id
  }

  if (unattended || !isInteractive) {
    throw new Error(
      'Token ID or label is required in non-interactive mode. Provide a token as an argument.',
    )
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

  const {prompt, apiClient} = context
  const client = apiClient({requireUser: true, requireProject: true}).config({
    apiVersion: '2021-06-07',
  })

  const config = client.config()
  const tokens = await client.request<Token[]>({url: `/projects/${config.projectId}/tokens`})
  const token = tokens.find((t) => t.id === tokenId)

  if (!token) {
    throw new Error('Token not found')
  }

  return prompt.single({
    type: 'confirm',
    message: `Are you sure you want to delete the token "${token.label}"?`,
    default: false,
  })
}
