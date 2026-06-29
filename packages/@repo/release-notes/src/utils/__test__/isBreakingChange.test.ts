import {CommitParser} from 'conventional-commits-parser'
import {describe, expect, it} from 'vitest'

import {getParserOptions} from '../getCommits'
import {isBreakingChange} from '../isBreakingChange'

async function parse(message: string) {
  return new CommitParser(await getParserOptions()).parse(message)
}

describe('getParserOptions', () => {
  it('parses headers with the breaking-change marker', async () => {
    const commit = await parse('feat!: upgrade to vite 8 (#12960)')
    expect(commit.type).toBe('feat')
    expect(commit.subject).toBe('upgrade to vite 8 (#12960)')
  })

  it('parses scoped headers with the breaking-change marker', async () => {
    const commit = await parse('feat(core)!: remove deprecated auth.mode config (#12865)')
    expect(commit.type).toBe('feat')
    expect(commit.scope).toBe('core')
    expect(commit.subject).toBe('remove deprecated auth.mode config (#12865)')
  })
})

describe('isBreakingChange', () => {
  it('detects the `!` header marker', async () => {
    expect(isBreakingChange(await parse('fix!: drop support for node 20 (#12859)'))).toBe(true)
    expect(isBreakingChange(await parse('chore(deps)!: bump @portabletext/editor to v7'))).toBe(
      true,
    )
  })

  it('detects BREAKING CHANGE footers', async () => {
    const commit = await parse(
      'feat(studio): use groq2024 search strategy by default\n\nBREAKING CHANGE: the legacy search strategy is no longer available',
    )
    expect(isBreakingChange(commit)).toBe(true)
  })

  it('returns false for non-breaking commits', async () => {
    expect(isBreakingChange(await parse('feat(form): add new array input component'))).toBe(false)
    expect(isBreakingChange(await parse('fix(cli): handle missing config'))).toBe(false)
  })
})
