import React from 'react'

class ValidationList extends React.Component {
  render() {
    const {messages} = this.props
    const styles = {}
    if (!messages) {
      return null
    }

    return (
      <ul className={styles.validationList}>
        {messages.map((msg, i) =>
          <li key={i} className={styles[msg.type]}>
            {msg.message}
          </li>
        )}
      </ul>
    )
  }
}

export default ValidationList
