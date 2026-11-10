import {describe, expect, it} from 'vitest'

import {splitShellWords} from './shellWords'

describe('splitShellWords', () => {
  it('splits on unquoted whitespace and keeps quoted words whole', () => {
    expect(splitShellWords('curl  \'https://a.b/c?q=1 2\'\t"x y" z')).toEqual([
      'curl',
      'https://a.b/c?q=1 2',
      'x y',
      'z',
    ])
    expect(splitShellWords('')).toEqual([])
    expect(splitShellWords('   \n ')).toEqual([])
    // An empty quoted word is a word
    expect(splitShellWords("a '' b")).toEqual(['a', '', 'b'])
  })

  it('joins adjacent quoted and unquoted segments into one word', () => {
    expect(splitShellWords(`-H'Accept: */*'`)).toEqual(['-HAccept: */*'])
    expect(splitShellWords(`'it'"'"'s'`)).toEqual(["it's"])
    expect(splitShellWords(`'it'\\''s'`)).toEqual(["it's"])
  })

  it('reads backslash escapes outside quotes and the few bash reads inside double quotes', () => {
    expect(splitShellWords('a\\ b c\\\\d')).toEqual(['a b', 'c\\d'])
    expect(splitShellWords('"say \\"hi\\" for \\$5 and \\\\ or \\n"')).toEqual([
      'say "hi" for $5 and \\ or \\n',
    ])
    // A single quote protects everything
    expect(splitShellWords(`'\\n $HOME "q"'`)).toEqual(['\\n $HOME "q"'])
  })

  it('continues a word across a backslash-newline, as a copied command spans lines', () => {
    expect(splitShellWords("curl 'https://a.b/' \\\n  -H 'x: y' \\\r\n  --compressed")).toEqual([
      'curl',
      'https://a.b/',
      '-H',
      'x: y',
      '--compressed',
    ])
    expect(splitShellWords('"one \\\ntwo"')).toEqual(['one two'])
  })

  it("reads bash's ANSI-C quoting, which Chrome uses for bodies with control characters", () => {
    expect(splitShellWords(`$'{"query":"*[\\n  _id == \\'a\\'\\t]"}'`)).toEqual([
      `{"query":"*[\n  _id == 'a'\t]"}`,
    ])
    expect(splitShellWords(`$'\\x41\\u00e9\\U0001F600\\101\\\\\\"\\e'`)).toEqual(['Aé😀A\\"\x1b'])
    // An escape bash does not know stays as written
    expect(splitShellWords(`$'\\q'`)).toEqual(['\\q'])
    // A `$` that does not start ANSI-C quoting is a character
    expect(splitShellWords('"Bearer $SANITY_API_TOKEN" $HOME')).toEqual([
      'Bearer $SANITY_API_TOKEN',
      '$HOME',
    ])
  })

  it('returns null for an unclosed quote', () => {
    expect(splitShellWords("curl 'https://a.b")).toBeNull()
    expect(splitShellWords('curl "https://a.b')).toBeNull()
    expect(splitShellWords("curl $'https://a.b")).toBeNull()
  })
})
