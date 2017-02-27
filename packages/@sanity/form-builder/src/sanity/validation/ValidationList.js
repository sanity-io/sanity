import React, {PropTypes} from 'react'

function ValidationList(props) {
  const messages = props.messages
  const styles = {}

  if (!messages || !messages.length) {
    return null
  }

  return (
    <ul className={styles.validationList}>
      {messages.map((msg, i) =>
        <li key={i} className={styles[msg.type]}>
          msg.message
        </li>
      )}
    </ul>
  )
}

ValidationList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    message: PropTypes.string,
    values: PropTypes.object
  }))
}

export default ValidationList
