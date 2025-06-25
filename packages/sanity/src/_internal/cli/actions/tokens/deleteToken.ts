import {type CliCommandContext} from '@sanity/cli'
import {type Token} from '../../commands/tokens/types'

interface DeleteTokenFlags {
  force?: boolean
}

export async function deleteToken(
  specifiedToken: string,
  flags: DeleteTokenFlags,
  context: CliCommandContext,
): Promise<boolean> {
  const {apiClient} = context
  const client = apiClient({requireUser: true, requireProject: true})

  const tokenId = await promptForToken(specifiedToken, context)

  if (!flags.force && !(await confirmDeletion(tokenId, context))) {
    return false
  }

  await client.request({
    method: 'DELETE',
    uri: `/tokens/${tokenId}`,
  })

  return true
}

async function promptForToken(
  specified: string | undefined,
  context: CliCommandContext,
): Promise<string> {
  const {prompt, apiClient} = context
  const client = apiClient({requireUser: true, requireProject: true})

  const tokens = await client.request<Token[]>({url: '/tokens'})

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

  const choices = tokens.map((token) => ({
    value: token.id,
    name: `${token.label} (${token.roles.map((r) => r.title).join(', ')})`,
  }))

  return prompt.single({
    message: 'Select token to delete:',
    type: 'list',
    choices,
  })
}

async function confirmDeletion(tokenId: string, context: CliCommandContext): Promise<boolean> {
  const {prompt, apiClient} = context
  const client = apiClient({requireUser: true, requireProject: true})

  const tokens = await client.request<Token[]>({url: '/tokens'})
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
