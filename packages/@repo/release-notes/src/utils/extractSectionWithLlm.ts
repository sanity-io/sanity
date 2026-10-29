import {Anthropic} from '@anthropic-ai/sdk'

const MODEL = 'claude-haiku-4-5'

type AnthropicLike = {
  messages: {
    create: Anthropic['messages']['create']
  }
}

export type ExtractSectionOptions = {
  client?: AnthropicLike
}

const PROMPT_HEADER = `You will be given the "Notes for release" section from a GitHub pull request body. Return only the parts written by the human author, exactly as raw markdown, and do NOT include the section heading itself.

Exclude any content added by automated review tools - Cursor Bugbot, GitHub Copilot Code Review, Cursor summaries, or similar reviewer commentary. These typically appear as GFM alerts, blockquotes describing the change, or HTML comment markers such as <!-- CURSOR_SUMMARY -->. Include everything the human wrote: images, bulleted or numbered lists, code blocks, links, plain paragraphs.

If the section is empty, contains only an opt-out like "N/A", or reduces to that after removing tool noise, return exactly the string N/A on its own.

Do not summarize, rewrite, or add commentary. Return the raw markdown verbatim.

Section:
`

export async function extractSectionWithLlm(
  rawSection: string,
  options: ExtractSectionOptions = {},
): Promise<null | string> {
  if (!rawSection.trim()) return ''

  const client = options.client ?? createDefaultClient()
  if (!client) return null

  try {
    const message = await client.messages.create({
      max_tokens: 4096,
      messages: [{role: 'user', content: PROMPT_HEADER + rawSection}],
      model: MODEL,
      stream: false,
    })
    const text = message.content
      .map((part) => (part.type === 'text' ? part.text : ''))
      .join('')
      .trim()
    if (!text) return ''
    if (text.toLowerCase() === 'n/a') return ''
    if (!isSubstringLenient(text, rawSection)) return null
    return text
  } catch (err) {
    console.warn(
      new Error('Request to Claude API failed during release notes extraction', {cause: err}),
    )
    return null
  }
}

function createDefaultClient(): AnthropicLike | null {
  const apiKey = process.env.RELEASE_NOTES_CLAUDE_API_KEY
  if (!apiKey) return null
  return new Anthropic({apiKey})
}

function isSubstringLenient(needle: string, haystack: string): boolean {
  const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase()
  return normalize(haystack).includes(normalize(needle))
}
