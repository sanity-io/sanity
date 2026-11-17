import {describe, expect, it} from 'vitest'

import {
  diffLocaleStrings,
  type LocaleChange,
  type LocaleString,
  parseLocaleStrings,
} from '../src/copy-review/extract.ts'
import {buildLlmPayload, LLM_MODEL, reviewWithLlm} from '../src/copy-review/llm.ts'
import {renderReport} from '../src/copy-review/report.ts'
import {checkChange, countWords, plainText} from '../src/copy-review/rules.ts'

const BEFORE = `import {defineLocalesResources} from '../../i18n/helpers'

/**
 * Defined locale strings for the releases tool, in US English.
 *
 * @internal
 */
const releasesLocaleStrings = defineLocalesResources('releases', {
  /** Action text for publishing all documents in a release (and the release itself) */
  'action.publish-all-documents': 'Run release',
  /** Title for the dialog confirming the publish of a release */
  'publish-dialog.confirm-publish.title':
    'Are you sure you want to publish the release and all document versions?',
  /*
   * Multi-line comment
   * for the checkbox
   */
  'publish-dialog.confirm-publish.update-drafts-checkbox': 'Update existing drafts',
  'no-comment': \`Template value\`,
  'interpolated': \`not \${'static'}\`,
})

export default releasesLocaleStrings
`

const AFTER = BEFORE.replace(
  "'Are you sure you want to publish the release and all document versions?'",
  `"Run the '{{title}}' release?"`,
).replace(
  '})\n\nexport default',
  `  /** Label above the list of drafts that would be discarded */
  'publish-dialog.confirm-publish.update-drafts-review': 'Open a draft to see what would be lost:',
})

export default`,
)

const failing: typeof fetch = async () => new Response('nope', {status: 401})
const refusing: typeof fetch = async () => Response.json({stop_reason: 'refusal', content: []})

function change(newValue: string, overrides: Partial<LocaleChange> = {}): LocaleChange {
  return {
    file: 'resources.ts',
    key: 'some.key',
    kind: 'changed',
    oldValue: undefined,
    newValue,
    comment: undefined,
    ...overrides,
  }
}

function ruleIds(value: string, siblings: LocaleString[] = []): string[] {
  return checkChange(change(value), {siblings}).map((hit) => hit.rule)
}

describe('parseLocaleStrings', () => {
  it('reads string entries with the comment directly above each key', () => {
    const entries = parseLocaleStrings(BEFORE)
    expect(entries).toEqual([
      {
        key: 'action.publish-all-documents',
        value: 'Run release',
        comment: 'Action text for publishing all documents in a release (and the release itself)',
      },
      {
        key: 'publish-dialog.confirm-publish.title',
        value: 'Are you sure you want to publish the release and all document versions?',
        comment: 'Title for the dialog confirming the publish of a release',
      },
      {
        key: 'publish-dialog.confirm-publish.update-drafts-checkbox',
        value: 'Update existing drafts',
        comment: 'Multi-line comment for the checkbox',
      },
      {key: 'no-comment', value: 'Template value', comment: undefined},
    ])
  })

  it('returns nothing for a file that does not exist at a ref', () => {
    expect(parseLocaleStrings('')).toEqual([])
  })
})

describe('diffLocaleStrings', () => {
  it('reports added and changed keys with their old value and comment', () => {
    const changes = diffLocaleStrings(
      'resources.ts',
      parseLocaleStrings(BEFORE),
      parseLocaleStrings(AFTER),
    )
    expect(changes).toEqual([
      {
        file: 'resources.ts',
        key: 'publish-dialog.confirm-publish.title',
        kind: 'changed',
        oldValue: 'Are you sure you want to publish the release and all document versions?',
        newValue: "Run the '{{title}}' release?",
        comment: 'Title for the dialog confirming the publish of a release',
      },
      {
        file: 'resources.ts',
        key: 'publish-dialog.confirm-publish.update-drafts-review',
        kind: 'added',
        oldValue: undefined,
        newValue: 'Open a draft to see what would be lost:',
        comment: 'Label above the list of drafts that would be discarded',
      },
    ])
  })

  it('treats every key of a new file as added', () => {
    const changes = diffLocaleStrings('resources.ts', [], parseLocaleStrings(BEFORE))
    expect(changes.map((item) => item.kind)).toEqual(['added', 'added', 'added', 'added'])
  })
})

describe('rules', () => {
  it('flags "Are you sure" confirmations', () => {
    expect(ruleIds('Are you sure you want to delete this release?')).toEqual(['no-are-you-sure'])
    expect(ruleIds("Delete the '{{title}}' release?")).toEqual([])
  })

  it('flags a draft described as having unpublished changes', () => {
    // The string that prompted this check
    expect(
      ruleIds(
        'The existing draft of {{count}} document will be discarded so that drafts match the published release. Unpublished draft changes will be lost.',
      ),
    ).toEqual(['no-unpublished-draft', 'passive-will-be'])
    expect(ruleIds('This draft has unpublished changes')).toEqual(['no-unpublished-draft'])
    expect(ruleIds('Discard unpublished drafts')).toEqual(['no-unpublished-draft'])
    // A document (not a draft) can have unpublished changes
    expect(ruleIds('This document has no unpublished changes')).toEqual([])
    expect(ruleIds('This document is already unpublished.')).toEqual([])
  })

  it('flags sentences over 25 words, counting interpolations as words and ignoring markup', () => {
    const long =
      'This sentence keeps on going with many plain words so that it runs past the limit that the Simplified Technical English rules set for procedural text today.'
    expect(countWords(long)).toBe(27)
    expect(ruleIds(long)).toEqual(['long-sentence'])
    expect(ruleIds(`Short one. ${long.replace('today.', '')}`)).toEqual(['long-sentence'])
    expect(ruleIds('Two short sentences. Both are fine.')).toEqual([])
    expect(plainText("The '<strong>{{title}}</strong>' release")).toBe("The '{{title}}' release")
  })

  it('warns on "will be" passives, regular and irregular', () => {
    const hits = checkChange(change('Those draft changes will be lost.'), {siblings: []})
    expect(hits).toMatchObject([{rule: 'passive-will-be', severity: 'warn'}])
    expect(ruleIds('The documents will be permanently deleted.')).toEqual(['passive-will-be'])
    expect(ruleIds('You lose those draft changes.')).toEqual([])
    expect(ruleIds('This will be available soon')).toEqual([])
  })

  it('warns when a string set names one action two ways', () => {
    const siblings = parseLocaleStrings(BEFORE)
    const hits = checkChange(change('Publish the release now', {key: 'new.key'}), {siblings})
    expect(hits).toMatchObject([{rule: 'consistent-terms', severity: 'warn'}])
    expect(hits[0]?.message).toContain('`action.publish-all-documents`')
    // Before the fix, the dialog title said "publish" next to the "Run release" button
    expect(ruleIds("Run the '{{title}}' release?", siblings)).toEqual(['consistent-terms'])
    // After it, the whole set says "run"
    expect(ruleIds("Run the '{{title}}' release?", parseLocaleStrings(AFTER))).toEqual([])
    // "published … release" is not the action of carrying out a release
    expect(ruleIds('Documents published before this release', siblings)).toEqual([])
  })

  it('ignores deprecated siblings and the changed key itself', () => {
    const siblings: LocaleString[] = [
      {key: 'old', value: 'Run release', comment: '@deprecated no longer in use'},
      {key: 'self', value: 'Publish the release', comment: undefined},
    ]
    const hits = checkChange(change('Publish the release', {key: 'self'}), {siblings})
    expect(hits).toEqual([])
  })
})

describe('renderReport', () => {
  it('lists strings with hits first and folds the rest away', () => {
    const changes = diffLocaleStrings(
      'resources.ts',
      parseLocaleStrings(BEFORE),
      parseLocaleStrings(AFTER),
    )
    const report = renderReport({
      reviewed: [
        {
          change: changes[1]!,
          hits: [{rule: 'passive-will-be', severity: 'warn', message: 'm', suggestion: 's'}],
        },
        {change: changes[0]!, hits: []},
      ],
      llm: '_Skipped._',
      range: 'abc..HEAD',
    })
    expect(report).toContain(
      '2 added or changed strings in 1 locale file (abc..HEAD) · 0 errors, 1 warning',
    )
    expect(report).toContain('- ⚠️ **passive-will-be**: m _Suggestion:_ s')
    expect(report).toContain('<details><summary>1 string with no rule hits</summary>')
    expect(report.indexOf('update-drafts-review')).toBeLessThan(report.indexOf('<details>'))
    expect(report).toContain(
      '- Before: `Are you sure you want to publish the release and all document versions?`',
    )
  })

  it('says so when nothing changed', () => {
    expect(renderReport({reviewed: [], llm: '', range: 'a..b'})).toContain(
      'No added or changed English strings.',
    )
  })
})

describe('LLM pass', () => {
  const changes = [
    change('Those draft changes will be lost.', {
      key: 'k',
      oldValue: 'Unpublished draft changes will be lost.',
      comment: 'Checkbox help text',
    }),
  ]

  it('sends only keys, comments and the old and new strings', () => {
    const payload = buildLlmPayload(changes)
    const json = JSON.parse(payload.slice(payload.indexOf('['), payload.lastIndexOf(']') + 1))
    expect(json).toEqual([
      {
        key: 'k',
        context: 'Checkbox help text',
        before: 'Unpublished draft changes will be lost.',
        after: 'Those draft changes will be lost.',
      },
    ])
    expect(payload).not.toContain('resources.ts')
  })

  it('calls the Messages API and returns the text blocks', async () => {
    const requests: {url: string; init: RequestInit}[] = []
    const fakeFetch: typeof fetch = async (url, init) => {
      requests.push({url: String(url), init: init ?? {}})
      return Response.json({
        stop_reason: 'end_turn',
        content: [
          {type: 'thinking', thinking: ''},
          {type: 'text', text: '- `k`: say who loses what'},
        ],
      })
    }
    await expect(reviewWithLlm(changes, {apiKey: 'test-key', fetch: fakeFetch})).resolves.toBe(
      '- `k`: say who loses what',
    )
    const body = JSON.parse(String(requests[0]?.init.body))
    expect(requests[0]?.url).toBe('https://api.anthropic.com/v1/messages')
    expect(body.model).toBe(LLM_MODEL)
    expect(body).not.toHaveProperty('temperature')
    expect(new Headers(requests[0]?.init.headers).get('x-api-key')).toBe('test-key')
  })

  it('throws on an error response or a refusal, so the report can say the pass did not run', async () => {
    await expect(reviewWithLlm(changes, {apiKey: 'x', fetch: failing})).rejects.toThrow('401')
    await expect(reviewWithLlm(changes, {apiKey: 'x', fetch: refusing})).rejects.toThrow('declined')
  })
})
