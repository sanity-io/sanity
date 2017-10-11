import React from 'react'
import LoginStatus from './LoginStatus'
import styles from './styles/Navigation.css'
import Search from './Search'

export default class DesktopNavigation extends React.PureComponent {
  render() {
    return (
      <div className={styles.root}>
        <div className={styles.search}>
          <Search />
        </div>
        <div className={styles.loginStatus}>
          <LoginStatus />
        </div>
      </div>
    )
  }
}
