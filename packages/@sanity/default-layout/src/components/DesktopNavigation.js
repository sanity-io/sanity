import PropTypes from 'prop-types'
import React from 'react'
import LoginStatus from './LoginStatus'
import styles from './styles/DesktopNavigation.css'
import Branding from './Branding'
import Search from './Search'

export default class DesktopNavigation extends React.Component {
  static propTypes = {
    tools: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string
    }))
  }

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
