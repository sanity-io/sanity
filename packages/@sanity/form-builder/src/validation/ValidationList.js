import PropTypes from 'prop-types'
import React from 'react'

export default class ValidationList extends React.Component {
  static propTypes = {
    messages: PropTypes.array
  }

  render() {
    const {messages} = this.props
    if (!messages || messages.length === 0) {
      return null
    }
    return (
      <ul>
        {messages.map((msg, i) =>
          <li key={i}>{msg.message}</li>
        )}
      </ul>
    )
  }
}
