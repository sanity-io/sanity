import {
  type AgentProposal,
  type ConfidenceHat,
  type ConfidenceLevel,
  type MockBatch,
  type TrustTier,
} from './types'

const HATS: readonly ConfidenceHat[] = [
  'strategist',
  'author',
  'reviewer',
  'localizer',
  'developer',
  'marketer',
  'ops-owner',
]
const LEVELS: readonly ConfidenceLevel[] = ['low', 'medium', 'high']
const TIERS: readonly TrustTier[] = ['T0', 'T1', 'T2', 'T3']
const REVERSIBILITY: readonly AgentProposal['reversibility'][] = ['draft', 'staged-release', 'live']

interface CopyEdit {
  before: string
  after: string
  intent: string
}

const COPY_EDITS: readonly CopyEdit[] = [
  {
    before: 'A logical humanoid species.',
    after:
      'A logical humanoid species from the desert world of Vulcan, known for emotional discipline and pointed ears.',
    intent: 'Expand a thin placeholder into a specific, reader-ready description.',
  },
  {
    before: 'this is the description',
    after: 'A concise summary that leads with the subject and states why it matters.',
    intent: 'Replace stub text with a real summary in the house voice.',
  },
  {
    before: 'Warriors from Qo’noS. Very tough and honorable and strong.',
    after: 'Warriors from Qo’noS whose culture is built on honor, combat, and bloodwine feasts.',
    intent: 'Trim redundancy and tighten the opening line.',
  },
  {
    before: 'small furry creatures',
    after: 'Small, furry, purring creatures that reproduce at an alarming rate.',
    intent: 'Apply sentence case and add a defining detail.',
  },
  {
    before: 'TODO: write a proper blurb here',
    after: 'A short, sentence-case blurb that a reader can skim in one breath.',
    intent: 'Resolve a leftover authoring TODO.',
  },
  {
    before: 'Blue skinned people with antennae from Andoria the ice moon',
    after: 'Blue-skinned, antennaed humanoids from the icy moon of Andoria.',
    intent: 'Fix hyphenation and comma spacing for readability.',
  },
]

const SUMMARY_TEMPLATES: readonly string[] = [
  'Tighten “{field}” to sentence case and lead with the subject',
  'Expand “{field}” with a specific supporting detail',
  'Rewrite “{field}” to match the house voice',
  'Trim redundancy from “{field}” and sharpen the opening line',
]

const EVIDENCE_POOL: readonly string[] = [
  'Style guide §3.2 — sentence case',
  'Similar field in “Vulcan” (published)',
  'Tone reference — “Ten Forward Lounge” playlist',
  'Glossary — canonical spelling of “Starfleet”',
  'Editorial checklist — lead with the subject',
  'Recent approved edit on a sibling document',
]

const BATCH_TITLES: readonly string[] = [
  'Overnight consistency pass',
  'Weekly copy-edit sweep',
  'Style-guide alignment run',
  'Placeholder cleanup pass',
]

/**
 * Types in the test studio that expose no long-form field, so a batch targeting
 * “description” falls back to “name”.
 */
const NAME_ONLY_TYPES: ReadonlySet<string> = new Set(['house', 'author'])

/**
 * FNV-1a string hash. Deterministic 32-bit seed derived from the inputs.
 */
function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * mulberry32 PRNG. Pure function of its seed, so results are stable across reloads.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

function pickMany<T>(rng: () => number, items: readonly T[], count: number): T[] {
  const pool = [...items]
  const result: T[] = []
  const total = Math.min(count, pool.length)
  for (let i = 0; i < total; i++) {
    const index = Math.floor(rng() * pool.length)
    result.push(pool.splice(index, 1)[0])
  }
  return result
}

export function getMockProposal(
  documentId: string,
  documentType: string,
  fieldName: string,
  seed = 0,
): AgentProposal {
  const rng = mulberry32(hashString(`${documentId}:${documentType}:${fieldName}:${seed}`))

  const hat = pick(rng, HATS)
  const confidence = pick(rng, LEVELS)
  const tier = pick(rng, TIERS)
  const reversibility = pick(rng, REVERSIBILITY)
  const edit = pick(rng, COPY_EDITS)

  const evidenceCount = 2 + Math.floor(rng() * 2)
  const evidence = pickMany(rng, EVIDENCE_POOL, evidenceCount)

  const id = `mock-proposal-${hashString(`${documentId}:${fieldName}:${seed}`).toString(36)}`

  return {
    id,
    documentId,
    documentType,
    fieldName,
    hat,
    changeSummary: pick(rng, SUMMARY_TEMPLATES).replace('{field}', fieldName),
    diff: {field: fieldName, before: edit.before, after: edit.after},
    intent: edit.intent,
    evidence,
    confidence,
    reversibility,
    tier,
  }
}

export function getMockBatch(
  paneKey: string,
  items: Array<{documentId: string; documentType: string}>,
): MockBatch {
  const rng = mulberry32(hashString(`batch:${paneKey}`))
  const hat = pick(rng, HATS)
  const title = pick(rng, BATCH_TITLES)

  const desired = Math.round(items.length * 0.4)
  const minimum = items.length >= 2 ? 2 : items.length
  const count = Math.min(items.length, Math.max(desired, minimum))
  const picked = pickMany(rng, items, count)

  const proposals = picked.map((item, index) => {
    const fieldName = NAME_ONLY_TYPES.has(item.documentType) ? 'name' : 'description'
    // the whole batch is one agent wearing one hat
    return {...getMockProposal(item.documentId, item.documentType, fieldName, index), hat}
  })

  return {
    id: `mock-batch-${hashString(paneKey).toString(36)}`,
    hat,
    title,
    createdBy: 'agent',
    proposals,
  }
}
