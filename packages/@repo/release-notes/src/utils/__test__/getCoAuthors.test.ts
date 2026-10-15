import {CommitParser} from 'conventional-commits-parser'
import {describe, expect, it} from 'vitest'

import {getCoAuthors} from '../getCoAuthors'
import {getParserOptions} from '../getCommits'

function parse(message: string) {
  return new CommitParser(getParserOptions()).parse(message)
}

describe('getCoAuthors', () => {
  it('reads trailers that the parser places in the footer', () => {
    const commit = parse(
      'chore(release): publish v6.18.0 (#15200)\n\nCo-authored-by: squiggler-app[bot] <265501495+squiggler-app[bot]@users.noreply.github.com>',
    )
    expect(commit.body).toBe('')
    expect(commit.footer).toContain('Co-authored-by')
    expect(getCoAuthors(commit)).toEqual([
      {
        name: 'squiggler-app[bot]',
        email: '265501495+squiggler-app[bot]@users.noreply.github.com',
      },
    ])
  })

  it('reads trailers that follow body text', () => {
    const commit = parse(
      'feat(core): add thing (#1)\n\nSome description of the change.\n\nCo-authored-by: Ada Lovelace <ada@example.com>\nCo-authored-by: @grace',
    )
    expect(getCoAuthors(commit)).toEqual([
      {name: 'Ada Lovelace', email: 'ada@example.com'},
      {username: 'grace'},
    ])
  })

  it('returns an empty list when there are no trailers', () => {
    expect(getCoAuthors(parse('fix(cli): handle missing config'))).toEqual([])
    expect(getCoAuthors(parse('fix(cli): handle missing config\n\nJust a body.'))).toEqual([])
  })
})
