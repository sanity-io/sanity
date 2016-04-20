import React from 'react'
import Logo from './Logo'
import LoginStatus from './LoginStatus'
import styles from '../styles/Header.css'

class Header extends React.Component {
  render() {
    return (
      <header className={styles.header}>
        <h1 className={styles.brand}>
          <Logo height="30" />
        </h1>

        <LoginStatus />
      </header>
    )
  }
}

export default Header
