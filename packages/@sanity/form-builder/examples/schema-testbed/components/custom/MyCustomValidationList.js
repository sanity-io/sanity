import PropTypes from 'prop-types'
import React from 'react'
import styles from '../styles/ValidationList.css'

class ValidationList extends React.Component {
  static propTypes = {
    messages: PropTypes.array
  }

  render() {
    const {messages} = this.props
    if (!messages) {
      return null
    }
    return (
      <ul className={styles.validationList}>
        {messages.map((msg, i) => (
          <li key={i} className={styles[msg.type]}>
            {msg.message}
          </li>
        ))}
      </ul>
    )
  }
}

export default ValidationList
