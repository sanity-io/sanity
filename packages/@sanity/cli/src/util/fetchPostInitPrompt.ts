import {type SanityClient} from '@sanity/client'
import {type Chalk} from 'chalk'

interface PostInitPromptResponse {
  message?: string
}

interface FetchPostInitPromptOptions {
  client: SanityClient
  editorNames: string
  chalk: Chalk
}

const DEFAULT_MESSAGE =
  'To set up your project with the MCP server, restart {{editorNames}} and type **"Get started with Sanity"** in the chat.'

/**
 * Applies cyan formatting to text wrapped in **markers**.
 */
function applyCyanFormatting(text: string, chalk: Chalk): string {
  return text.replace(/\*\*([^*]+)\*\*/g, (_, content) => chalk.cyan(content))
}

/**
 * Fetches the post-init MCP prompt from the Journey API and interpolates editor names.
 * Falls back to a hardcoded default if the API call fails, times out, or returns empty.
 * Text wrapped in **markers** will be formatted with cyan color.
 */
export async function fetchPostInitPrompt({
  client,
  editorNames,
  chalk,
}: FetchPostInitPromptOptions): Promise<string> {
  try {
    const data = await client.request<PostInitPromptResponse | null>({
      method: 'GET',
      uri: '/journey/mcp/post-init-prompt',
      timeout: 1000,
    })
    const template = data?.message || DEFAULT_MESSAGE
    const interpolated = template.replace(/\{\{editorNames\}\}/g, editorNames)
    return applyCyanFormatting(interpolated, chalk)
  } catch {
    const interpolated = DEFAULT_MESSAGE.replace(/\{\{editorNames\}\}/g, editorNames)
    return applyCyanFormatting(interpolated, chalk)
  }
}
