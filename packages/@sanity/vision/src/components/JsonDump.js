/* eslint-disable react/prop-types, react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import tokenize from 'json-lexer'

const punctuator = token => <span className={token.className}>{token.raw}</span>
const number = token => <span className={token.className}>{token.raw}</span>
const string = token => <span className={token.className}>{token.raw}</span>
const key = token => <span className={token.className}>{token.raw.slice(1, -1)}</span>
const formatters = {punctuator, key, string, number}

class JsonBlock extends React.PureComponent {
  render() {
    const styles = this.context.styles.jsonDump
    const json = JSON.stringify(this.props.data, null, 2)
    const tokens = tokenize(json).map((token, i, arr) => {
      const prevToken = i === 0 ? token : arr[i - 1]
      if (
        token.type === 'string' &&
        prevToken.type === 'whitespace' &&
        /^\n\s+$/.test(prevToken.value)
      ) {
        token.type = 'key'
      }

      return token
    })

    return (
      <pre className={styles.block}>
        {tokens.map((token, i) => {
          const Formatter = formatters[token.type]
          return Formatter ? (
            <Formatter key={i} className={styles[token.type]} raw={token.raw} />
          ) : (
            token.raw
          )
        })}
      </pre>
    )
  }
}

JsonBlock.contextTypes = {
  styles: PropTypes.object
}

export default function JsonDump(props) {
  if (!Array.isArray(props.data)) {
    return <JsonBlock data={props.data} />
  }

  return (
    <code>
      {props.data.map((row, i) => <JsonBlock key={row._id || row.eventId || i} data={row} />)}
    </code>
  )
}
