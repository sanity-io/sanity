import React from 'react'
import Logo from './Logo'
import LoginStatus from './LoginStatus'
import styles from '../styles/Header.css'

class Header extends React.Component {
  render() {
    return (
      <header className={styles.header} {...this.props}>
        <h1 className={styles.brand}>
          <div className={styles.logoContainer}>
            <Logo />
          </div>
        </h1>
        <LoginStatus />
      </header>
    )
  }
}

export default Header
