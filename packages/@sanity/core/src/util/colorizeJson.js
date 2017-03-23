const tokenize = require('json-lexer')

const identity = inp => inp
const formatters = {
  punctuator: 'white',
  key: 'white',
  string: 'green',
  number: 'yellow',
  literal: 'bold',
}

function colorize(input, chalk) {
  const data = typeof input === 'string' ? JSON.parse(input) : input
  const json = JSON.stringify(data, null, 2)

  return tokenize(json)
    .map((token, i, arr) => {
      // Note how the following only works because we pretty-print the JSON
      const prevToken = i === 0 ? token : arr[i - 1]
      if (token.type === 'string' && prevToken.type === 'whitespace' && /^\n\s+$/.test(prevToken.value)) {
        token.type = 'key'
      }

      return token
    })
    .map((token, i) => {
      const formatter = chalk[formatters[token.type]] || identity
      return formatter(token.raw)
    })
    .join('')
}

module.exports = colorize
