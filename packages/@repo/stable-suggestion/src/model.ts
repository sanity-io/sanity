import {type Anthropic} from '@anthropic-ai/sdk'

import {getModel, MODEL_EFFORT, SHORTLIST_SIZE, TEXT_LIMITS} from './config'
import {GENERAL_CONCERN, type Prompt} from './prompt'
import {stripControlChars} from './render'
import {
  type Candidate,
  type Evaluation,
  type ModelFailureReason,
  type Recommendation,
  type ShortlistEntry,
} from './types'

const MAX_OUTPUT_TOKENS = 8000
const REQUEST_TIMEOUT_MS = 120_000
const MAX_RETRIES = 2

export interface ModelClient {
  messages: {
    create(
      params: Anthropic.MessageCreateParamsNonStreaming,
      options?: {timeout?: number; maxRetries?: number},
    ): PromiseLike<{
      content: ReadonlyArray<{type: string; text?: string}>
      stop_reason: string | null
    }>
  }
}

export type ModelAnswer =
  | {status: 'answered'; stopReason: string | null; text: string}
  | {status: 'failed'; reason: ModelFailureReason}

interface ModelOutput {
  decision: 'promote' | 'hold'
  shortlist: {version: string; reason: string}[]
  headline: string
  rationale: string
  concerns: {version: string; note: string}[]
  confidence: 'low' | 'medium' | 'high'
}

export async function askModel(client: ModelClient, prompt: Prompt): Promise<ModelAnswer> {
  try {
    const message = await client.messages.create(
      {
        model: getModel(),
        max_tokens: MAX_OUTPUT_TOKENS,
        system: prompt.system,
        messages: [{role: 'user', content: prompt.user}],
        output_config: {
          effort: MODEL_EFFORT,
          format: {type: 'json_schema', schema: prompt.schema},
        },
      },
      {timeout: REQUEST_TIMEOUT_MS, maxRetries: MAX_RETRIES},
    )
    const text = message.content
      .map((block) => (block.type === 'text' ? (block.text ?? '') : ''))
      .join('')
    return {status: 'answered', stopReason: message.stop_reason, text}
  } catch {
    return {status: 'failed', reason: 'api-error'}
  }
}

const BARE_URL = /https?:\/\/\S+/gi

function cleanText(text: string, limit: number): string {
  return stripControlChars(text).replace(BARE_URL, '').trim().slice(0, limit)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDecision(value: unknown): value is ModelOutput['decision'] {
  return value === 'promote' || value === 'hold'
}

function isConfidence(value: unknown): value is ModelOutput['confidence'] {
  return value === 'low' || value === 'medium' || value === 'high'
}

function readPairs(value: unknown, textKey: string): {version: string; text: string}[] | null {
  if (!Array.isArray(value)) return null
  const items: unknown[] = value
  const pairs = items.flatMap((item) => {
    if (!isRecord(item)) return []
    const version = item.version
    const text = item[textKey]
    return typeof version === 'string' && typeof text === 'string' ? [{version, text}] : []
  })
  return pairs.length === items.length ? pairs : null
}

function readOutput(text: string): ModelOutput | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  if (!isRecord(parsed)) return null
  const {recommendation, headline, rationale, confidence} = parsed
  const shortlist = readPairs(parsed.shortlist, 'reason')
  const concerns = readPairs(parsed.concerns, 'note')
  if (
    shortlist === null ||
    concerns === null ||
    !isDecision(recommendation) ||
    !isConfidence(confidence) ||
    typeof headline !== 'string' ||
    typeof rationale !== 'string'
  ) {
    return null
  }
  return {
    decision: recommendation,
    shortlist: shortlist.map((pair) => ({version: pair.version, reason: pair.text})),
    headline,
    rationale,
    concerns: concerns.map((pair) => ({version: pair.version, note: pair.text})),
    confidence,
  }
}

function describeCandidateFlags(candidate: Candidate | undefined): string {
  if (candidate === undefined || candidate.soft.length === 0) {
    return 'Passes every hard rule with no soft flags.'
  }
  return `Passes every hard rule. Flags: ${candidate.soft.map((verdict) => verdict.detail).join('; ')}`
}

function deterministicShortlist(evaluation: Evaluation): ShortlistEntry[] {
  return evaluation.shortlist.map((version) => ({
    version,
    reason: cleanText(
      describeCandidateFlags(evaluation.candidates.find((item) => item.version === version)),
      TEXT_LIMITS.reason,
    ),
  }))
}

export function summariseHardReasons(evaluation: Evaluation): string {
  const counts = evaluation.candidates
    .flatMap((candidate) => candidate.hard.map((verdict) => verdict.code))
    .reduce((tally, code) => tally.set(code, (tally.get(code) ?? 0) + 1), new Map<string, number>())
  const entries = [...counts].map(([code, count]) => `${code} x${count}`)
  return entries.length > 0 ? entries.join(', ') : 'no candidates'
}

export function deterministicRecommendation(
  evaluation: Evaluation,
  reason: ModelFailureReason,
): Recommendation {
  const shortlist = deterministicShortlist(evaluation)
  const [top] = shortlist
  const decision = top ? 'promote' : 'hold'
  return {
    schemaVersion: 1,
    evaluation,
    decision,
    shortlist,
    source: 'deterministic',
    fallbackReason: reason,
    model: null,
    headline: top ? `Promote ${top.version}` : 'Hold: no version is eligible to promote',
    rationale: cleanText(
      top
        ? `${top.version} is the newest of ${evaluation.eligible.length} eligible versions. ${top.reason}`
        : `No version passes the hard rules. Blocking reasons: ${summariseHardReasons(evaluation)}.`,
      TEXT_LIMITS.rationale,
    ),
    concerns: [],
    confidence: null,
  }
}

function pickFailure(answer: ModelAnswer, output: ModelOutput | null): ModelFailureReason | null {
  if (answer.status === 'failed') return answer.reason
  if (answer.stopReason === 'refusal') return 'refusal'
  if (answer.stopReason === 'max_tokens') return 'truncated'
  return output === null ? 'invalid-json' : null
}

function uniqueByVersion<Item extends {version: string}>(items: Item[]): Item[] {
  return items.filter(
    (item, index) => items.findIndex((other) => other.version === item.version) === index,
  )
}

export function toRecommendation(
  answer: ModelAnswer,
  evaluation: Evaluation,
  model: string,
): Recommendation {
  if (evaluation.eligible.length === 0) {
    return deterministicRecommendation(evaluation, 'no-eligible-versions')
  }
  const output = answer.status === 'answered' ? readOutput(answer.text) : null
  const failure = pickFailure(answer, output)
  if (failure !== null || output === null) {
    return deterministicRecommendation(evaluation, failure ?? 'invalid-json')
  }
  const eligible = new Set(evaluation.eligible)
  if (output.shortlist.some((entry) => !eligible.has(entry.version))) {
    return deterministicRecommendation(evaluation, 'outside-eligible-set')
  }
  const picked = uniqueByVersion(output.shortlist).slice(0, SHORTLIST_SIZE)
  if (output.decision === 'promote' && picked.length === 0) {
    return deterministicRecommendation(evaluation, 'empty-shortlist')
  }
  const shortlist =
    picked.length > 0
      ? picked.map((entry) => ({
          version: entry.version,
          reason: cleanText(entry.reason, TEXT_LIMITS.reason),
        }))
      : deterministicShortlist(evaluation)
  const knownVersions = new Set([
    GENERAL_CONCERN,
    ...evaluation.candidates.map((candidate) => candidate.version),
  ])
  return {
    schemaVersion: 1,
    evaluation,
    decision: output.decision,
    shortlist,
    source: 'model',
    fallbackReason: null,
    model,
    headline: cleanText(output.headline, TEXT_LIMITS.headline),
    rationale: cleanText(output.rationale, TEXT_LIMITS.rationale),
    concerns: output.concerns
      .filter((concern) => knownVersions.has(concern.version))
      .map((concern) => ({
        version: concern.version,
        note: cleanText(concern.note, TEXT_LIMITS.note),
      })),
    confidence: output.confidence,
  }
}
