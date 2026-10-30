import {readFileSync} from 'node:fs'
import path from 'node:path'

import {describe, expect, test, vi} from 'vitest'

import {
  type FailureVerdict,
  type GeneratorFailure,
  type GeneratorReport,
  parseGeneratorReport,
  parseVerdictsFile,
  type Seam,
  type VerdictsFile,
} from './contracts'
import {createClaudeExplainer, type Explainer} from './explain'
import {fileFailures, type ReportPair, summaryMarkdown} from './fileFailures'
import {engineIssueTitle, parseSections, printDefinition} from './issueBody'
import {
  createLinearIssues,
  issuesWithWholeLine,
  LINEAR_TARGET,
  type LinearIssueWithDescription,
  type LinearIssues,
} from './linear'

const handFiledIssues = JSON.parse(
  readFileSync(path.join(import.meta.dirname, '__fixtures__/handFiledIssues.json'), 'utf8'),
) as LinearIssueWithDescription[]

const COMMIT = 'a669759627'
const DMP_SIGNATURE = 'lost-edits | rejected | 400 | mutationError | diffMatchPatch'

function failure(signature: string, seam: Seam = 'pair'): GeneratorFailure {
  return {
    signature,
    signatureFields: {
      rule: 'lost-edits',
      fate: 'rejected',
      statusCode: 400,
      errorType: 'mutationError',
      operation: 'diffMatchPatch',
    },
    message: 'Lost edits: A set title "one" (rejected with 400)',
    seed: 7,
    definition: {
      id: 'GEN',
      title: 'Generated sequence',
      seam,
      initial: [{_id: 'drafts.article-gen', _type: 'article', title: 'draft'}],
      idPair: {publishedId: 'article-gen', draftId: 'drafts.article-gen'},
      clients: ['A', 'B'],
      steps: [
        {client: 'A', do: 'patch', id: 'drafts.article-gen', patches: [{set: {title: 'one'}}]},
        {do: 'outside', mutations: [{patch: {id: 'drafts.article-gen', unset: ['title']}}]},
        {do: 'settle'},
      ],
    },
  }
}

function verdict(signature: string, overrides: Partial<FailureVerdict> = {}): FailureVerdict {
  return {
    signature,
    verdict: 'confirmed',
    summary: 'The real Content Lake answered 400 mutationError for the same submission.',
    differences: [],
    replayed: 2,
    ...overrides,
  }
}

function pair(
  failures: GeneratorFailure[],
  verdicts: FailureVerdict[],
  seam: Seam = 'pair',
): ReportPair {
  const report: GeneratorReport = {version: 1, commit: COMMIT, seam, failures}
  const verdictsFile: VerdictsFile = {version: 1, commit: COMMIT, seam, verdicts}
  return {report, verdicts: verdictsFile}
}

function fakeLinear(existing: LinearIssueWithDescription[] = []) {
  const create = vi.fn<LinearIssues['create']>(async () => ({
    identifier: 'SAPP-9000',
    url: 'https://linear.app/sanity/issue/SAPP-9000',
  }))
  const findBySignatureLine = vi.fn<LinearIssues['findBySignatureLine']>(async (line) =>
    issuesWithWholeLine(existing, line),
  )
  return {create, findBySignatureLine}
}

const explanation = {
  whatHappens: 'Client A sets `title`, another user unsets it first, and A loses the edit.',
  userImpact: 'A loses the edit and the document stays "not in sync".',
  likelyCause: '* `SquashingBuffer.optimiseSetOperation` turns the set into a stale patch.',
}

function explainWith(result = explanation) {
  return vi.fn<Explainer>(async () => result)
}

describe('whole-line dedupe', () => {
  test('a shorter signature does not match an issue carrying a longer one it prefixes', () => {
    const line = 'sync-gen-signature: World did not settle within N rounds; inconsistent'

    expect(issuesWithWholeLine(handFiledIssues, line).map((issue) => issue.identifier)).toEqual([
      'SAPP-4793',
    ])
  })

  test('a line that is only the start of a filed line matches nothing', () => {
    expect(
      issuesWithWholeLine(handFiledIssues, 'sync-gen-signature: unhandled rejections'),
    ).toEqual([])
  })

  test('every hand-filed line matches its own issue and no other', () => {
    const lines = [
      [
        'SAPP-4792',
        'sync-gen-signature: World did not settle within N rounds; inconsistent [Unable to apply diffMatchPatch to target title]',
      ],
      ['SAPP-4793', 'sync-gen-signature: World did not settle within N rounds; inconsistent'],
      ['SAPP-4794', 'sync-gen-signature: unhandled rejections [Rejected with 409]'],
      ['SAPP-4795', 'sync-gen-signature: A view of drafts.article-N'],
    ]

    lines.forEach(([identifier, line]) => {
      expect(issuesWithWholeLine(handFiledIssues, line).map((issue) => issue.identifier)).toEqual([
        identifier,
      ])
    })
  })

  test('the Linear client filters the API substring matches down to whole lines', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({data: {issues: {nodes: handFiledIssues}}})),
    )
    const linear = createLinearIssues('lin_key', fetchMock)
    const line = 'sync-gen-signature: World did not settle within N rounds; inconsistent'

    const found = await linear.findBySignatureLine(line)

    expect(found.map((issue) => issue.identifier)).toEqual(['SAPP-4793'])
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body.variables.filter).toEqual({
      team: {id: {eq: LINEAR_TARGET.teamId}},
      description: {contains: line},
    })
  })

  test('the Linear client creates issues in the SAPP project with the sync label only', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({
            data: {issueCreate: {success: true, issue: {identifier: 'SAPP-1', url: 'u'}}},
          }),
        ),
    )
    const linear = createLinearIssues('lin_key', fetchMock)

    await linear.create({title: 'title', description: 'body'})

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body.variables.input).toEqual({
      teamId: LINEAR_TARGET.teamId,
      projectId: LINEAR_TARGET.projectId,
      labelIds: [LINEAR_TARGET.labelId],
      title: 'title',
      description: 'body',
    })
  })
})

describe('fileFailures', () => {
  test('skips a failure whose signature line is already filed', async () => {
    const existing = [
      {
        identifier: 'SAPP-4792',
        url: 'https://linear.app/sanity/issue/SAPP-4792',
        description: `## Failure signature\n\n\`\`\`\nsync-gen-signature: ${DMP_SIGNATURE}\n\`\`\``,
      },
    ]
    const linear = fakeLinear(existing)
    const explain = explainWith()

    const summary = await fileFailures([pair([failure(DMP_SIGNATURE)], [verdict(DMP_SIGNATURE)])], {
      dryRun: false,
      linear,
      explain,
    })

    expect(summary.outcomes).toMatchObject([
      {action: 'duplicate', issues: [{identifier: 'SAPP-4792'}]},
    ])
    expect(linear.create).not.toHaveBeenCalled()
    expect(explain).not.toHaveBeenCalled()
  })

  test('files a new engine bug with the script-owned sections and one signature line', async () => {
    const linear = fakeLinear()

    const summary = await fileFailures([pair([failure(DMP_SIGNATURE)], [verdict(DMP_SIGNATURE)])], {
      dryRun: false,
      linear,
      explain: explainWith(),
    })

    expect(summary.outcomes).toMatchObject([{action: 'filed', kind: 'engine'}])
    const [{title, description}] = linear.create.mock.calls[0]
    expect(title).toBe(
      'an edit is lost after its save is rejected (400 mutationError) in diffMatchPatch',
    )
    expect(parseSections(description).map((section) => section.heading)).toEqual([
      'What happens',
      'User impact',
      'Likely cause',
      'Repro',
      'Real Content Lake',
      'Failure signature',
    ])
    expect(description).toContain(printDefinition(failure(DMP_SIGNATURE)))
    expect(description).toContain(`a669759627`)
    expect(description.split('\n').filter((line) => line.startsWith('sync-gen-'))).toEqual([
      `sync-gen-signature: ${DMP_SIGNATURE}`,
    ])
  })

  test('files nothing when the AI text rewrites a script-owned section', async () => {
    const linear = fakeLinear()
    const explain = explainWith({
      ...explanation,
      likelyCause: `${explanation.likelyCause}\n\n## Repro\n\nsomething else`,
    })

    const summary = await fileFailures([pair([failure(DMP_SIGNATURE)], [verdict(DMP_SIGNATURE)])], {
      dryRun: false,
      linear,
      explain,
    })

    expect(summary.outcomes).toMatchObject([{action: 'error'}])
    expect(summary.outcomes[0].reason).toMatch(/Refusing to file/)
    expect(linear.create).not.toHaveBeenCalled()
  })

  test('files nothing when the AI text smuggles in a second signature line', async () => {
    const linear = fakeLinear()
    const explain = explainWith({
      ...explanation,
      userImpact: 'sync-gen-signature: something else',
    })

    const summary = await fileFailures([pair([failure(DMP_SIGNATURE)], [verdict(DMP_SIGNATURE)])], {
      dryRun: false,
      linear,
      explain,
    })

    expect(summary.outcomes[0].reason).toMatch(/exactly one signature line/)
    expect(linear.create).not.toHaveBeenCalled()
  })

  test('files nothing when the AI text leaves a code fence open', async () => {
    const linear = fakeLinear()
    const explain = explainWith({...explanation, whatHappens: '```ts\nconst open = true'})

    const summary = await fileFailures([pair([failure(DMP_SIGNATURE)], [verdict(DMP_SIGNATURE)])], {
      dryRun: false,
      linear,
      explain,
    })

    expect(summary.outcomes[0].action).toBe('error')
    expect(linear.create).not.toHaveBeenCalled()
  })

  test('routes a fake mismatch to a fake-model issue without the AI step', async () => {
    const linear = fakeLinear()
    const explain = explainWith()
    const mismatch = verdict(DMP_SIGNATURE, {
      verdict: 'fake-mismatch',
      summary: 'The real Content Lake accepted the submission the fake rejected.',
      differences: [
        {submission: 0, transactionId: 'tx-1', field: 'statusCode', fake: 400, real: 200},
      ],
    })

    await fileFailures([pair([failure(DMP_SIGNATURE)], [mismatch])], {
      dryRun: false,
      linear,
      explain,
    })

    expect(explain).not.toHaveBeenCalled()
    expect(linear.findBySignatureLine).toHaveBeenCalledWith(
      `sync-gen-fake-signature: ${DMP_SIGNATURE}`,
    )
    const [{title, description}] = linear.create.mock.calls[0]
    expect(title).toMatch(/^fake content lake differs from the real one: /)
    expect(description).toContain('"fake": 400')
    expect(description).not.toContain(`sync-gen-signature: ${DMP_SIGNATURE}`)
  })

  test('an engine issue with the same signature does not block a fake-model issue', async () => {
    const existing = [
      {identifier: 'SAPP-1', url: 'u', description: `sync-gen-signature: ${DMP_SIGNATURE}`},
    ]
    const linear = fakeLinear(existing)

    const summary = await fileFailures(
      [pair([failure(DMP_SIGNATURE)], [verdict(DMP_SIGNATURE, {verdict: 'fake-mismatch'})])],
      {dryRun: false, linear, explain: explainWith()},
    )

    expect(summary.outcomes).toMatchObject([{action: 'filed', kind: 'fake-model'}])
  })

  test('files nothing for an error verdict and reports it', async () => {
    const linear = fakeLinear()

    const summary = await fileFailures(
      [
        pair(
          [failure(DMP_SIGNATURE)],
          [verdict(DMP_SIGNATURE, {verdict: 'error', summary: 'Dataset creation failed with 429'})],
        ),
      ],
      {dryRun: false, linear, explain: explainWith()},
    )

    expect(summary.outcomes).toMatchObject([
      {action: 'error', reason: 'verify failed: Dataset creation failed with 429'},
    ])
    expect(linear.findBySignatureLine).not.toHaveBeenCalled()
    expect(linear.create).not.toHaveBeenCalled()
  })

  test('reports a failure without a verdict and a verdict without a failure', async () => {
    const summary = await fileFailures([pair([failure(DMP_SIGNATURE)], [verdict('settle')])], {
      dryRun: true,
      explain: explainWith(),
    })

    expect(summary.outcomes.map((outcome) => [outcome.signature, outcome.reason])).toEqual([
      ['settle', 'verdict has no matching failure in the report'],
      [DMP_SIGNATURE, 'no verdict for this failure'],
    ])
  })

  test('refuses a verdicts file from another commit', async () => {
    const mismatched = pair([failure(DMP_SIGNATURE)], [verdict(DMP_SIGNATURE)])

    const summary = await fileFailures(
      [{...mismatched, verdicts: {...mismatched.verdicts, commit: 'other'}}],
      {dryRun: true, explain: explainWith()},
    )

    expect(summary.outcomes[0].reason).toMatch(/verdicts are for commit other/)
  })

  test('files a signature found on both seams once', async () => {
    const linear = fakeLinear()

    const summary = await fileFailures(
      [
        pair([failure(DMP_SIGNATURE)], [verdict(DMP_SIGNATURE)]),
        pair([failure(DMP_SIGNATURE, 'operations')], [verdict(DMP_SIGNATURE)], 'operations'),
      ],
      {dryRun: false, linear, explain: explainWith()},
    )

    expect(summary.outcomes.map((outcome) => outcome.action)).toEqual(['filed', 'duplicate'])
    expect(linear.create).toHaveBeenCalledTimes(1)
  })

  test('a dry run looks up duplicates but never writes', async () => {
    const linear = fakeLinear()

    const summary = await fileFailures([pair([failure(DMP_SIGNATURE)], [verdict(DMP_SIGNATURE)])], {
      dryRun: true,
      linear,
      explain: explainWith(),
    })

    expect(linear.findBySignatureLine).toHaveBeenCalledTimes(1)
    expect(linear.create).not.toHaveBeenCalled()
    expect(summary.outcomes).toMatchObject([{action: 'would-file'}])
    expect(summaryMarkdown(summary)).toContain('<details><summary>an edit is lost')
  })

  test('a dry run without a Linear key says dedupe was skipped', async () => {
    const summary = await fileFailures([pair([failure(DMP_SIGNATURE)], [verdict(DMP_SIGNATURE)])], {
      dryRun: true,
      explain: explainWith(),
    })

    expect(summary.dedupe).toBe('skipped')
    expect(summaryMarkdown(summary)).toContain('Dedupe skipped')
  })
})

describe('issue titles', () => {
  test('start lowercase and read from the signature fields', () => {
    expect(
      engineIssueTitle({rule: 'unhandled-rejections', statusCode: 409, errorType: 'mutationError'}),
    ).toBe('an unhandled promise rejection escapes (409 mutationError)')
    expect(engineIssueTitle({rule: 'healthy', check: 'consistent'})).toBe(
      'a client ends up unhealthy: consistent',
    )
    expect(engineIssueTitle({rule: 'step', check: 'commit'})).toBe('a step throws: commit')
  })
})

describe('contracts', () => {
  test('rejects a verdict outside the four known values', () => {
    const raw = JSON.stringify({
      version: 1,
      commit: COMMIT,
      seam: 'pair',
      verdicts: [{...verdict('x'), verdict: 'maybe'}],
    })

    expect(() => parseVerdictsFile(raw)).toThrow(/verdict must be one of/)
  })

  test('rejects a report failure without signature fields', () => {
    const raw = JSON.stringify({
      version: 1,
      commit: COMMIT,
      seam: 'pair',
      failures: [{...failure('x'), signatureFields: undefined}],
    })

    expect(() => parseGeneratorReport(raw)).toThrow(/signatureFields.rule is missing/)
  })
})

describe('createClaudeExplainer', () => {
  test('asks the configured model for JSON and returns the three sections', async () => {
    const create = vi.fn(async () => ({
      stop_reason: 'end_turn',
      content: [{type: 'text', text: JSON.stringify(explanation)}],
    }))
    const explain = createClaudeExplainer({
      apiKey: 'unused',
      model: 'claude-sonnet-5-5',
      client: {messages: {create}} as never,
    })

    const result = await explain({
      title: 't',
      signature: DMP_SIGNATURE,
      message: 'm',
      definitionLiteral: 'd',
      seam: 'pair',
      realContentLake: 'r',
    })

    expect(result).toEqual(explanation)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-5-5',
        output_config: expect.objectContaining({
          format: expect.objectContaining({type: 'json_schema'}),
        }),
      }),
    )
  })
})
