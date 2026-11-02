import {readFileSync} from 'node:fs'
import path from 'node:path'

import {describe, expect, test, vi} from 'vitest'

import {
  type FailureVerdict,
  type GeneratorFailure,
  type GeneratorReport,
  type GeneratorSample,
  parseGeneratorReport,
  parseVerdictsFile,
  type SampleVerdict,
  type Seam,
  type VerdictsFile,
} from './contracts'
import {createClaudeExplainer, type Explainer} from './explain'
import {fakeSignatureOf} from './fakeSignature'
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
const FAKE_SIGNATURE = fakeSignatureOf(
  [
    {
      request: {
        kind: 'mutations',
        mutations: [{patch: {id: 'drafts.article-gen', diffMatchPatch: {title: '@@ -1 +1 @@'}}}],
      },
    },
  ],
  {
    submission: 0,
    transactionId: 'tx-1',
    recorded: {statusCode: 200},
    fake: {statusCode: 200},
    real: {statusCode: 400, errorType: 'mutationError'},
    fakeDocuments: {},
    realDocuments: {},
  },
)

const INITIAL = [{_id: 'drafts.article-gen', _type: 'article', title: 'draft'}]

function definition(seam: Seam, id: string, title: string): GeneratorFailure['definition'] {
  return {
    id,
    title,
    seam,
    initial: INITIAL,
    idPair: {publishedId: 'article-gen', draftId: 'drafts.article-gen'},
    clients: ['A', 'B'],
    steps: [
      {client: 'A', do: 'patch', id: 'drafts.article-gen', patches: [{set: {title: 'one'}}]},
      {do: 'outside', mutations: [{patch: {id: 'drafts.article-gen', unset: ['title']}}]},
      {do: 'settle'},
    ],
  }
}

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
    definition: definition(seam, 'GEN-7-1', 'Generated with SYNC_GEN_SEED=7'),
    initial: INITIAL,
    submissions: [],
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
  sampled: {samples: GeneratorSample[]; verdicts: SampleVerdict[]} = {samples: [], verdicts: []},
): ReportPair {
  const report: GeneratorReport = {
    version: 1,
    commit: COMMIT,
    seam,
    seeds: [7],
    runsPerSeed: 100,
    maxSteps: 8,
    failures,
    samples: sampled.samples,
  }
  const verdictsFile: VerdictsFile = {
    version: 1,
    commit: COMMIT,
    seam,
    verdicts,
    samples: sampled.verdicts,
  }
  return {report, verdicts: verdictsFile}
}

function sample(runIndex: number): GeneratorSample {
  return {
    seed: 7,
    runIndex,
    definition: definition(
      'pair',
      `GEN-SAMPLE-7-${runIndex}`,
      `Passing run ${runIndex} of SYNC_GEN_SEED=7`,
    ),
    initial: INITIAL,
    submissions: [],
  }
}

function sampleVerdict(runIndex: number, overrides: Partial<SampleVerdict> = {}): SampleVerdict {
  return {
    seed: 7,
    runIndex,
    verdict: 'confirmed',
    summary: 'Every submission matched.',
    differences: [],
    replayed: 3,
    ...overrides,
  }
}

const fakeMismatchSample = {
  verdict: 'fake-mismatch' as const,
  fakeSignature: FAKE_SIGNATURE,
  summary: 'The real Content Lake rejected a diffMatchPatch the fake accepted.',
  differences: [
    {submission: 1, transactionId: 'tx-2', field: 'statusCode' as const, fake: 200, real: 400},
  ],
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
      async () =>
        new Response(
          JSON.stringify({
            data: {
              issues: {nodes: handFiledIssues, pageInfo: {hasNextPage: false, endCursor: null}},
            },
          }),
        ),
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

  test('the Linear client follows pages until the whole-line match turns up', async () => {
    const line = 'sync-gen-signature: A view of drafts.article-N'
    const longer = {
      identifier: 'SAPP-1',
      url: 'u1',
      description: `${line} and then some`,
    }
    const exact = {identifier: 'SAPP-2', url: 'u2', description: line}
    const pages = [
      {nodes: [longer], pageInfo: {hasNextPage: true, endCursor: 'cursor-1'}},
      {nodes: [exact], pageInfo: {hasNextPage: false, endCursor: null}},
    ]
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({data: {issues: pages.shift()}})),
    )
    const linear = createLinearIssues('lin_key', fetchMock)

    const found = await linear.findBySignatureLine(line)

    expect(found.map((issue) => issue.identifier)).toEqual(['SAPP-2'])
    const afters = fetchMock.mock.calls.map(
      (call) => JSON.parse(String(call[1]?.body)).variables.after,
    )
    expect(afters).toEqual([null, 'cursor-1'])
  })

  test('the Linear client gives up with an error when the pages never end', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({
            data: {issues: {nodes: [], pageInfo: {hasNextPage: true, endCursor: 'more'}}},
          }),
        ),
    )
    const linear = createLinearIssues('lin_key', fetchMock)

    await expect(linear.findBySignatureLine('sync-gen-signature: x')).rejects.toThrow(/10 pages/)
    expect(fetchMock).toHaveBeenCalledTimes(10)
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

  test('prints the repro as a hand-filed style literal with the harness imports', async () => {
    const linear = fakeLinear()

    await fileFailures([pair([failure(DMP_SIGNATURE)], [verdict(DMP_SIGNATURE)])], {
      dryRun: false,
      linear,
      explain: explainWith(),
    })

    const [{description}] = linear.create.mock.calls[0]
    const repro = parseSections(description).find((section) => section.heading === 'Repro')?.body
    expect(repro).toContain(
      "import {runSyncTest, type SyncTestDefinition} from '../../../../../test/sync/syncTest'",
    )
    expect(repro).not.toContain('articleSchema')
    expect(repro).toContain('Pass it to `runSyncTest(syncTest)`.')
    expect(repro).toContain("id: 'GEN',")
    expect(repro).toContain(
      "{client: 'A', do: 'patch', id: 'drafts.article-gen', patches: [{set: {title: 'one'}}]},",
    )
    const literal = repro?.match(/```ts\n([\s\S]*?)\n```/)?.[1]
    expect(literal).not.toContain('"')
  })

  test('points an operations repro at the exported article schema', async () => {
    const linear = fakeLinear()

    await fileFailures(
      [pair([failure(DMP_SIGNATURE, 'operations')], [verdict(DMP_SIGNATURE)], 'operations')],
      {dryRun: false, linear, explain: explainWith()},
    )

    const [{description}] = linear.create.mock.calls[0]
    expect(description).toContain(
      "import {articleSchema} from '../../../../../test/sync/generator'",
    )
    expect(description).toContain(
      "runSyncTest(syncTest, {schema: articleSchema, typeName: 'article'})",
    )
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
      fakeSignature: FAKE_SIGNATURE,
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
      `sync-gen-fake-signature: ${FAKE_SIGNATURE}`,
    )
    const [{title, description}] = linear.create.mock.calls[0]
    expect(title).toBe(
      'fake content lake differs from the real one: mutations | patch:diffMatchPatch | 200->400 | mutationError',
    )
    expect(description).toContain('"fake": 400')
    expect(description).not.toContain(`sync-gen-signature: ${DMP_SIGNATURE}`)
  })

  test('an engine issue with the same signature does not block a fake-model issue', async () => {
    const existing = [
      {identifier: 'SAPP-1', url: 'u', description: `sync-gen-signature: ${DMP_SIGNATURE}`},
    ]
    const linear = fakeLinear(existing)

    const summary = await fileFailures(
      [
        pair(
          [failure(DMP_SIGNATURE)],
          [verdict(DMP_SIGNATURE, {verdict: 'fake-mismatch', fakeSignature: FAKE_SIGNATURE})],
        ),
      ],
      {dryRun: false, linear, explain: explainWith()},
    )

    expect(summary.outcomes).toMatchObject([{action: 'filed', kind: 'fake-model'}])
  })

  test('files nothing for a fake mismatch without a fakeSignature', async () => {
    const linear = fakeLinear()

    const summary = await fileFailures(
      [pair([failure(DMP_SIGNATURE)], [verdict(DMP_SIGNATURE, {verdict: 'fake-mismatch'})])],
      {dryRun: false, linear, explain: explainWith()},
    )

    expect(summary.outcomes).toMatchObject([
      {action: 'error', reason: 'fake-mismatch verdict has no fakeSignature'},
    ])
    expect(linear.create).not.toHaveBeenCalled()
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

describe('passing samples', () => {
  test('files a fake-mismatch sample as a fidelity issue without the AI step', async () => {
    const linear = fakeLinear()
    const explain = explainWith()

    const summary = await fileFailures(
      [
        pair([], [], 'pair', {
          samples: [sample(4)],
          verdicts: [sampleVerdict(4, fakeMismatchSample)],
        }),
      ],
      {dryRun: false, linear, explain},
    )

    expect(explain).not.toHaveBeenCalled()
    expect(summary.outcomes).toMatchObject([
      {source: 'sample', signature: FAKE_SIGNATURE, kind: 'fake-model', action: 'filed'},
    ])
    const [{title, description}] = linear.create.mock.calls[0]
    expect(title).toMatch(/^fake content lake differs from the real one: mutations/)
    expect(description).toContain('seed 7, run 4')
    expect(description).toContain('"real": 400')
    expect(description).not.toContain('It fails with')
    expect(description.split('\n').filter((line) => line.startsWith('sync-gen-'))).toEqual([
      `sync-gen-fake-signature: ${FAKE_SIGNATURE}`,
    ])
  })

  test('skips a sample gap already filed in Linear, matching whole lines only', async () => {
    const existing = [
      {
        identifier: 'SAPP-7',
        url: 'u7',
        description: `\`\`\`\nsync-gen-fake-signature: ${FAKE_SIGNATURE}\n\`\`\``,
      },
      {
        identifier: 'SAPP-8',
        url: 'u8',
        description: `sync-gen-fake-signature: ${FAKE_SIGNATURE} | document`,
      },
    ]
    const linear = fakeLinear(existing)

    const summary = await fileFailures(
      [
        pair([], [], 'pair', {
          samples: [sample(4)],
          verdicts: [sampleVerdict(4, fakeMismatchSample)],
        }),
      ],
      {dryRun: false, linear, explain: explainWith()},
    )

    expect(summary.outcomes).toMatchObject([
      {action: 'duplicate', issues: [{identifier: 'SAPP-7'}]},
    ])
    expect(linear.create).not.toHaveBeenCalled()
  })

  test('files nothing for confirmed samples and counts them as matched', async () => {
    const linear = fakeLinear()

    const summary = await fileFailures(
      [
        pair([], [], 'pair', {
          samples: [sample(1), sample(2), sample(3), sample(4)],
          verdicts: [
            sampleVerdict(1),
            sampleVerdict(2),
            sampleVerdict(3, {verdict: 'error', summary: 'Request timed out', replayed: 0}),
            sampleVerdict(4, {replayed: 0}),
          ],
        }),
      ],
      {dryRun: false, linear, explain: explainWith()},
    )

    expect(linear.findBySignatureLine).not.toHaveBeenCalled()
    expect(linear.create).not.toHaveBeenCalled()
    expect(summary.outcomes).toMatchObject([
      {
        source: 'sample',
        signature: 'sample seed 7 run 3',
        action: 'error',
        reason: 'verify failed: Request timed out',
      },
    ])
    expect(summary.fidelity).toEqual({
      samples: 4,
      replayed: 2,
      matched: 2,
      mismatched: 0,
      errors: 1,
      nothingToReplay: 1,
      submissions: 6,
    })
    expect(summaryMarkdown(summary)).toContain(
      'Fake fidelity: 2 of 2 replayed samples matched the real Content Lake (0 mismatches, 1 error, 1 with nothing to replay, 6 submissions replayed).',
    )
  })

  test('files a gap found by a failure and by samples once', async () => {
    const linear = fakeLinear()

    const summary = await fileFailures(
      [
        pair([], [], 'operations', {
          samples: [sample(5)],
          verdicts: [sampleVerdict(5, fakeMismatchSample)],
        }),
        pair(
          [failure(DMP_SIGNATURE)],
          [verdict(DMP_SIGNATURE, {verdict: 'fake-mismatch', fakeSignature: FAKE_SIGNATURE})],
          'pair',
          {samples: [sample(6)], verdicts: [sampleVerdict(6, fakeMismatchSample)]},
        ),
      ],
      {dryRun: false, linear, explain: explainWith()},
    )

    expect(linear.create).toHaveBeenCalledTimes(1)
    expect(linear.create.mock.calls[0][0].description).toContain('It fails with')
    expect(
      summary.outcomes.map((outcome) => [outcome.source, outcome.action, outcome.reason]),
    ).toEqual([
      ['failure', 'filed', undefined],
      ['sample', 'duplicate', `the same gap as failure \`${DMP_SIGNATURE}\` in this run`],
      ['sample', 'duplicate', `the same gap as failure \`${DMP_SIGNATURE}\` in this run`],
    ])
  })

  test('reports a sample without a verdict and a sample verdict without a sample', async () => {
    const summary = await fileFailures(
      [pair([], [], 'pair', {samples: [sample(1)], verdicts: [sampleVerdict(2)]})],
      {dryRun: true, explain: explainWith()},
    )

    expect(summary.outcomes.map((outcome) => [outcome.signature, outcome.reason])).toEqual([
      ['sample seed 7 run 2', 'sample verdict has no matching sample in the report'],
      ['sample seed 7 run 1', 'no verdict for this sample'],
    ])
  })

  test('says so when no samples were replayed', async () => {
    const summary = await fileFailures([pair([], [])], {dryRun: true, explain: explainWith()})

    expect(summaryMarkdown(summary)).toContain('Fake fidelity: no passing samples were replayed.')
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
    expect(engineIssueTitle({rule: 'settle', check: 'consistent', detail: 'nothing-sent'})).toBe(
      'the document never settles: consistent (nothing-sent)',
    )
    expect(
      engineIssueTitle({
        rule: 'settle',
        check: 'stream-errors',
        errorType: 'Error',
        thrownBy: 'DiffMatchPatch.apply',
      }),
    ).toBe('the document never settles (Error) thrown by DiffMatchPatch.apply: stream-errors')
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

  test('rejects a sample verdict outside confirmed, fake-mismatch and error', () => {
    const raw = JSON.stringify({
      version: 1,
      commit: COMMIT,
      seam: 'pair',
      verdicts: [],
      samples: [{...sampleVerdict(1), verdict: 'assumed'}],
    })

    expect(() => parseVerdictsFile(raw)).toThrow(/samples\[0\]\.verdict must be one of/)
  })

  test('accepts a report without samples', () => {
    const raw = JSON.stringify({version: 1, commit: COMMIT, seam: 'pair', failures: []})

    expect(parseGeneratorReport(raw).samples).toBeUndefined()
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
