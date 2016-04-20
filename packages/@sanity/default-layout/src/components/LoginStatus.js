import React from 'react'
import styles from '../styles/LoginStatus.css'

class LoginStatus extends React.Component {
  render() {
    return (
      <div className={styles.loginStatus}>
        You are logged in as [someone]
        <a href="#" className={styles.logout}>Log out</a>
      </div>
    )
  }
}

export default LoginStatus
