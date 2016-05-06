import React from 'react'
import styles from '../styles/LoginStatus.css'

class LoginStatus extends React.Component {
  render() {
    return (
      <div className={styles.loginStatus}>
        <span className={styles.text}>
          You are logged in as <span className={styles.userName}>[someone]</span>
        </span>
        <a href="#" className={styles.logout}>Log out</a>
      </div>
    )
  }
}

export default LoginStatus
