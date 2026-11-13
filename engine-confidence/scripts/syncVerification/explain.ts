import {readFileSync} from 'node:fs'
import path from 'node:path'

import Anthropic from '@anthropic-ai/sdk'

import {repositoryRoot} from '../paths'

export const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-5-5'

export interface ExplainInput {
  title: string
  signature: string
  message: string
  definitionLiteral: string
  seam: string
  evidence: string
  realContentLake: string
}

export interface Explanation {
  whatHappens: string
  userImpact: string
  likelyCause: string
}

export type Explainer = (input: ExplainInput) => Promise<Explanation>

const ENGINE_SOURCE_PATHS = [
  'packages/@sanity/mutator/src/document/BufferedDocument.ts',
  'packages/@sanity/mutator/src/document/SquashingBuffer.ts',
  'packages/@sanity/mutator/src/document/Document.ts',
  'packages/sanity/src/core/store/document/buffered-doc/createObservableBufferedDocument.ts',
  'packages/sanity/src/core/store/document/document-pair/checkoutPair.ts',
  'packages/sanity/src/core/store/document/document-pair/serverOperations/patch.ts',
  'packages/sanity/test/sync/syncTest.ts',
]

const HOUSE_STYLE = `You write three sections of a Linear issue about a bug in the Sanity Studio document sync engine, found by a property-based test generator. The script fills in every other section (the repro, the real server check, the failure signature); never repeat them.

Style:
- Plain declarative sentences. State the fact and stop. No hedging filler, no marketing words, no em dashes.
- Write about client A, client B and "another user", and name fields and documents as the repro does.
- Name code in backticks with its file path the first time.
- "whatHappens": one short paragraph describing the sequence and the outcome in plain words, as a user of two Studio tabs would see it.
- "userImpact": one to three sentences on what an editor loses or sees (lost edits, a document stuck "not in sync", errors in the console). Say plainly when the impact is only error-reporting noise.
- "likelyCause": a markdown bullet list, one mechanism per bullet, naming the function and file. The script labels the section a hypothesis, so do not add a label. Only claim what the source shows.
- No markdown headings, no code blocks; inline code only.

Examples of the house style, from issues filed by hand:

What happens: Client A changes \`title\` from "draft" to "one", and before that edit is saved another user unsets \`title\`. A's edit never reaches the server, A's document event stream errors with \`Unable to apply diffMatchPatch to target title\`, the same error escapes as an unhandled rejection, and A stays "not in sync" for good.

Likely cause:
* \`SquashingBuffer.optimiseSetOperation\` in \`packages/@sanity/mutator/src/document/SquashingBuffer.ts\` rewrites a string-to-string \`set\` into a \`diffMatchPatch\` built against A's local copy.
* When the unset arrives, \`BufferedDocument.handleDocMutation\` calls \`rebase\`, and \`SquashingBuffer.rebase\` applies that patch to a document with no \`title\` and throws.

What happens: Another user sets \`title\` to "one", and once client A has that value, A sets \`title\` to "one" too. A commits, nothing is sent to the server, and A stays "not in sync" for good.`

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    whatHappens: {type: 'string'},
    userImpact: {type: 'string'},
    likelyCause: {type: 'string'},
  },
  required: ['whatHappens', 'userImpact', 'likelyCause'],
  additionalProperties: false,
}

function readSources(paths: string[]): string {
  return paths
    .map((relativePath) => {
      const contents = readFileSync(path.join(repositoryRoot, relativePath), 'utf8')
      return `<source path="${relativePath}">\n${contents}\n</source>`
    })
    .join('\n\n')
}

function failurePrompt(input: ExplainInput): string {
  return [
    `Issue title: ${input.title}`,
    `Failure signature: ${input.signature}`,
    `Seam: ${input.seam}`,
    `Failure output:\n${input.message}`,
    `Shrunk repro:\n${input.definitionLiteral}`,
    `Evidence: ${input.evidence}`,
    `Real Content Lake check: ${input.realContentLake}`,
    'Write the three sections as JSON.',
  ].join('\n\n')
}

function isExplanation(value: unknown): value is Explanation {
  return (
    typeof value === 'object' &&
    value !== null &&
    ['whatHappens', 'userImpact', 'likelyCause'].every(
      (key) => typeof (value as Record<string, unknown>)[key] === 'string',
    )
  )
}

export function createClaudeExplainer(options: {
  apiKey: string
  model: string
  client?: Pick<Anthropic, 'messages'>
}): Explainer {
  const client = options.client ?? new Anthropic({apiKey: options.apiKey})
  const sources = readSources(ENGINE_SOURCE_PATHS)
  return async function explain(input) {
    const response = await client.messages.create({
      model: options.model,
      max_tokens: 16_000,
      system: [
        {type: 'text', text: HOUSE_STYLE},
        {type: 'text', text: sources, cache_control: {type: 'ephemeral'}},
      ],
      output_config: {effort: 'medium', format: {type: 'json_schema', schema: RESPONSE_SCHEMA}},
      messages: [{role: 'user', content: failurePrompt(input)}],
    })
    if (response.stop_reason === 'end_turn') {
      const text = response.content.flatMap((block) => (block.type === 'text' ? [block.text] : []))
      const parsed: unknown = JSON.parse(text.join(''))
      if (isExplanation(parsed)) return parsed
      throw new Error(`Claude returned an unexpected shape for "${input.signature}"`)
    }
    throw new Error(
      response.stop_reason === 'refusal'
        ? `Claude declined to explain "${input.signature}"`
        : `Claude stopped with ${response.stop_reason} before finishing "${input.signature}"`,
    )
  }
}

export function placeholderExplainer(): Explainer {
  const placeholder = '[written by Claude when SYNC_VERIFICATION_CLAUDE_API_KEY is set]'
  return async function explain() {
    return {whatHappens: placeholder, userImpact: placeholder, likelyCause: placeholder}
  }
}
