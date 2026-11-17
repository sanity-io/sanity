import {type LocaleChange} from './extract.ts'

export const LLM_MODEL = 'claude-sonnet-5-5'
const API_URL = 'https://api.anthropic.com/v1/messages'

export const RUBRIC = `You review user interface copy for Sanity Studio, a content editing app. Apply this rubric:
- Plain and short: everyday words, one idea per sentence, 25 words at most per sentence.
- The user's words: name things the way an editor would, not the way the code does.
- No tautology: do not say what is already true by definition (a draft is always unpublished).
- Consistent terms: one name per concept across the strings shown.
- Say what happens and what is lost: a confirmation names the action and its object, and states what the user cannot undo.
- Confirmations ask about the action ("Delete this release?"), never about the user ("Are you sure…?").
Keep {{interpolations}} and <Tags> exactly as written. Do not suggest changing keys.`

export const INSTRUCTIONS = `For each string that needs work, write one markdown bullet: the key in backticks, the problem in a few words, and a suggested rewrite. Skip strings that are fine. If every string is fine, answer "No suggestions." Answer with the bullets only.`

/**
 * The only data that leaves CI: each string's key, its TSDoc comment, and its old and new English
 * value. File contents, paths and the rest of the diff are never sent.
 */
export function buildLlmPayload(changes: LocaleChange[]): string {
  const strings = changes.map((change) => ({
    key: change.key,
    context: change.comment ?? null,
    before: change.oldValue ?? null,
    after: change.newValue,
  }))
  return `${INSTRUCTIONS}\n\n<strings>\n${JSON.stringify(strings, null, 2)}\n</strings>`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** The text of a Messages API response, without its (empty) thinking blocks */
function responseText(content: unknown): string {
  if (!Array.isArray(content)) return ''
  return content
    .map((block: unknown) =>
      isRecord(block) && block['type'] === 'text' && typeof block['text'] === 'string'
        ? block['text']
        : '',
    )
    .filter(Boolean)
    .join('\n')
    .trim()
}

/** Sends the changed strings to the Messages API and returns its suggestions as markdown */
export async function reviewWithLlm(
  changes: LocaleChange[],
  options: {apiKey: string; fetch?: typeof fetch},
): Promise<string> {
  const doFetch = options.fetch ?? fetch
  const response = await doFetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': options.apiKey,
      'anthropic-version': '2023-06-01',
      // Re-runs a request a safety classifier declines on a fallback model instead of failing it
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      max_tokens: 16_000,
      system: RUBRIC,
      output_config: {effort: 'low'},
      fallbacks: 'default',
      messages: [{role: 'user', content: buildLlmPayload(changes)}],
    }),
    signal: AbortSignal.timeout(120_000),
  })
  if (!response.ok) {
    throw new Error(`Messages API responded ${response.status}`)
  }
  const body: unknown = await response.json()
  if (!isRecord(body)) throw new Error('unexpected response from the Messages API')
  if (body['stop_reason'] === 'refusal') {
    throw new Error('the model declined the request')
  }
  return responseText(body['content']) || 'No suggestions.'
}
