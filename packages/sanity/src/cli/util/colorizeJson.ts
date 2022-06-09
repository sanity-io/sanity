import type {CliCommandContext} from '@sanity/cli'
import tokenize, {LexerToken} from 'json-lexer'

interface KeyToken {
  type: 'key'
  value: string
  raw: string
}

type ExtendedLexerToken = LexerToken | KeyToken

const identity = (inp: string): string => inp

export function colorizeJson(input: unknown, chalk: CliCommandContext['chalk']): string {
  const formatters: Record<ExtendedLexerToken['type'], (str: string) => string> = {
    punctuator: chalk.white,
    key: chalk.white,
    string: chalk.green,
    number: chalk.yellow,
    literal: chalk.bold,
    whitespace: identity,
  }

  const json = JSON.stringify(input, null, 2)

  return tokenize(json)
    .map((token, i, arr): ExtendedLexerToken => {
      // Note how the following only works because we pretty-print the JSON
      const prevToken = i === 0 ? token : arr[i - 1]
      if (
        token.type === 'string' &&
        prevToken.type === 'whitespace' &&
        /^\n\s+$/.test(prevToken.value)
      ) {
        return {...token, type: 'key'}
      }

      return token
    })
    .map((token) => {
      const formatter = formatters[token.type] || identity
      return formatter(token.raw)
    })
    .join('')
}
