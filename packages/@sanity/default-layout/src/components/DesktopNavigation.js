import React, {PropTypes} from 'react'
import LoginStatus from './LoginStatus'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import styles from './styles/DesktopNavigation.css'
import CompanyBranding from './CompanyBranding'
import tools from 'all:part:@sanity/base/tool'
import Search from './Search'

class DesktopNavigation extends React.Component {
  static contextTypes = {
    router: PropTypes.object,
  }
  render() {
    const {router} = this.context
    return (
      <div className={styles.root}>
        <CompanyBranding />
        <ToolSwitcher tools={tools} activeToolName={router.state.tool} className={styles.toolSwitcher} />
        <LoginStatus className={styles.loginStatus} />
        <div className={styles.searchContainer}>
          <Search />
        </div>
      </div>
    )
  }
}

export default DesktopNavigation
