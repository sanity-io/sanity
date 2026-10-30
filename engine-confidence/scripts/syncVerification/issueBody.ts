import {type Seam, type SignatureFields, type Verdict, type VerdictDifference} from './contracts'

export const ENGINE_SIGNATURE_PREFIX = 'sync-gen-signature: '
export const FAKE_SIGNATURE_PREFIX = 'sync-gen-fake-signature: '

export const SECTION = {
  whatHappens: 'What happens',
  userImpact: 'User impact',
  likelyCause: 'Likely cause',
  differences: 'Differences',
  repro: 'Repro',
  realContentLake: 'Real Content Lake',
  signature: 'Failure signature',
} as const

export const ENGINE_SECTION_ORDER = [
  SECTION.whatHappens,
  SECTION.userImpact,
  SECTION.likelyCause,
  SECTION.repro,
  SECTION.realContentLake,
  SECTION.signature,
]

const SYNC_DIRECTORY = 'packages/sanity/src/core/store/document/sync'
const GENERATOR_PATH = 'packages/sanity/test/sync/generator.ts'
const MESSAGE_LINE_LIMIT = 40

const RULE_PHRASES: Record<string, string> = {
  'converged': 'clients end up with different copies of the document',
  'revisions': 'clients disagree on the document revision',
  'healthy': 'a client ends up unhealthy',
  'keys': 'array items are lost or duplicated',
  'lost-edits': 'an edit is lost',
  'unhandled-rejections': 'an unhandled promise rejection escapes',
  'settle': 'the document never settles',
  'step': 'a step throws',
}

const FATE_PHRASES: Record<string, string> = {
  'rejected': 'after its save is rejected',
  'never-sent': 'because it is never sent',
  'never-answered': 'because its save is never answered',
}

export interface SignatureLine {
  prefix: string
  signature: string
}

export function signatureLineText({prefix, signature}: SignatureLine): string {
  return `${prefix}${signature}`
}

export interface ReproSource {
  definition: Record<string, unknown> & {seam: Seam}
  seed: number
  runIndex?: number
  message?: string
}

export interface ReplayResult {
  verdict: Verdict
  summary: string
  differences: VerdictDifference[]
  replayed: number
}

export function printDefinition(source: ReproSource): string {
  const fromFailure = source.runIndex === undefined
  const literal = JSON.stringify(
    {
      ...source.definition,
      id: fromFailure ? `GEN-${source.seed}` : `GEN-${source.seed}-${source.runIndex}`,
      title: fromFailure
        ? `Generated with SYNC_GEN_SEED=${source.seed}`
        : `Generated with SYNC_GEN_SEED=${source.seed}, passing run ${source.runIndex}`,
    },
    null,
    2,
  )
  return `const syncTest: SyncTestDefinition = ${literal.replace(/"(\w+)":/g, '$1:')}`
}

export function engineIssueTitle(fields: SignatureFields): string {
  const rule = RULE_PHRASES[fields.rule] ?? `the ${fields.rule} check fails`
  const fate = fields.fate === undefined ? '' : ` ${FATE_PHRASES[fields.fate] ?? fields.fate}`
  const status = [fields.statusCode, fields.errorType].filter((part) => part !== undefined)
  const statusText = status.length === 0 ? '' : ` (${status.join(' ')})`
  const check = fields.check === undefined ? '' : `: ${fields.check}`
  const operation = fields.operation === undefined ? '' : ` in ${fields.operation}`
  return `${rule}${fate}${statusText}${operation}${check}`
}

export function fakeIssueTitle(fakeSignature: string): string {
  return `fake content lake differs from the real one: ${fakeSignature.replace(/^fake-mismatch \| /, '')}`
}

function fenced(language: string, text: string): string {
  return `\`\`\`${language}\n${text}\n\`\`\``
}

function firstLines(text: string): string {
  const lines = text.split('\n')
  return lines.length > MESSAGE_LINE_LIMIT
    ? [
        ...lines.slice(0, MESSAGE_LINE_LIMIT),
        `... ${lines.length - MESSAGE_LINE_LIMIT} more lines`,
      ].join('\n')
    : text
}

function foundBy(source: ReproSource, commit: string): string {
  const seam = source.definition.seam
  return source.runIndex === undefined
    ? `Found by the weekly sync generator on commit \`${commit}\` (seed ${source.seed}, ${seam} seam).`
    : `Found by the weekly sync generator's passing sample on commit \`${commit}\` (seed ${source.seed}, run ${source.runIndex}, ${seam} seam). The sequence passes in the harness; the real Content Lake answers some of its submissions differently from the fake.`
}

export function reproSection(source: ReproSource, commit: string): string {
  const runCall =
    source.definition.seam === 'operations'
      ? `This uses the operations seam, so build \`@sanity/validation\` first (\`pnpm --filter @sanity/validation build\`) and run it with \`runSyncTest(syncTest, {schema, typeName: 'article'})\`, where \`schema\` is the generator's schema in \`${GENERATOR_PATH}\`.`
      : 'Pass it to `runSyncTest(syncTest)`.'
  const intro = `${foundBy(source, commit)} Put this in a scratch \`*.sync.test.ts\` in \`${SYNC_DIRECTORY}/\`. ${runCall}`
  const failureOutput =
    source.message === undefined
      ? [intro]
      : [`${intro} It fails with:`, fenced('', firstLines(source.message))]
  return [
    ...failureOutput,
    fenced('ts', printDefinition(source)),
    fenced('bash', `pnpm vitest run --project=sanity ${SYNC_DIRECTORY}/<scratch>.sync.test.ts`),
  ].join('\n\n')
}

const VERDICT_LEADS: Record<Verdict, string> = {
  'confirmed': 'Confirmed.',
  'assumed': 'Not verified against the real server.',
  'fake-mismatch': 'The real server disagrees with the fake.',
  'error': 'The verify step failed.',
}

export function realContentLakeSection(verdict: ReplayResult): string {
  const replayed = `${verdict.replayed} submission${verdict.replayed === 1 ? '' : 's'} replayed against a fresh dataset.`
  return `${VERDICT_LEADS[verdict.verdict]} ${verdict.summary.trim()} ${replayed}`.trim()
}

export function differencesSection(verdict: ReplayResult): string {
  return verdict.differences
    .map((difference) => {
      const target = difference.documentId === undefined ? '' : ` of \`${difference.documentId}\``
      return [
        `* Submission ${difference.submission} (\`${difference.transactionId}\`), ${difference.field}${target}:`,
        fenced('json', JSON.stringify({fake: difference.fake, real: difference.real}, null, 2)),
      ].join('\n\n')
    })
    .join('\n\n')
}

export function signatureSection(line: SignatureLine): string {
  return fenced('', signatureLineText(line))
}

export interface Section {
  heading: string
  body: string
}

export function renderSections(sections: Section[]): string {
  return sections.map((section) => `## ${section.heading}\n\n${section.body.trim()}`).join('\n\n')
}

function isFence(line: string): boolean {
  return line.trimStart().startsWith('```')
}

interface SectionScan {
  sections: Array<{heading: string; lines: string[]}>
  fenceLines: number
}

export function parseSections(markdown: string): Section[] {
  const scan = markdown.split('\n').reduce<SectionScan>(
    (state, line) => {
      const startsSection = state.fenceLines % 2 === 0 && line.startsWith('## ')
      if (startsSection) {
        state.sections.push({heading: line.slice(3).trim(), lines: []})
        return state
      }
      state.sections.at(-1)?.lines.push(line)
      state.fenceLines += isFence(line) ? 1 : 0
      return state
    },
    {sections: [], fenceLines: 0},
  )
  return scan.sections.map((section) => ({
    heading: section.heading,
    body: section.lines.join('\n').trim(),
  }))
}

export function hasBalancedFences(text: string): boolean {
  return text.split('\n').filter(isFence).length % 2 === 0
}
