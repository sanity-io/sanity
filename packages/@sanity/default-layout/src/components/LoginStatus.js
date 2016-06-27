import React from 'react'
import styles from '../../styles/LoginStatus.css'

class LoginStatus extends React.Component {
  render() {
    return (
      <div className={styles.loginStatus}>
        <img className={styles.userImage} />
      </div>
    )
  }
}

export default LoginStatus
