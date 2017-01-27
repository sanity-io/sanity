import React, {PropTypes} from 'react'
import LoginStatus from './LoginStatus'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import {WithRouter} from 'part:@sanity/base/router'
import styles from './styles/DesktopNavigation.css'
import CompanyBranding from './CompanyBranding'
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
        <CompanyBranding />
        <WithRouter>
          {router => (
            <ToolSwitcher
              tools={this.props.tools}
              activeToolName={router.state.tool}
              className={styles.toolSwitcher}
            />
          )}
        </WithRouter>
        <LoginStatus className={styles.loginStatus} />
        <div className={styles.searchContainer}>
          <Search />
        </div>
      </div>
    )
  }
}
