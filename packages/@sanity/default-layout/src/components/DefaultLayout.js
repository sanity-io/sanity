import React, {PropTypes} from 'react'
import ToolSwitcher from './ToolSwitcher'
import RenderTool from './RenderTool'
import {RouteScope} from '@sanity/state-router'
import styles from '../../styles/DefaultLayout.css'
import tools from 'all:part:@sanity/base/tool'
import absolutes from 'all:part:@sanity/base/absolutes'
import LoginStatus from './LoginStatus'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import CompanyLogo from 'part:@sanity/base/company-logo'
import Hamburger from './Hamburger'

class DefaultLayout extends React.Component {
  static contextTypes = {
    router: PropTypes.object,
  }
  componentWillMount() {
    const {router} = this.context
    if (!router.state.tool) {
      router.navigate({tool: tools[0].name})
    }
  }
  render() {
    const {router} = this.context
    return (
      <div className={styles.defaultLayout}>

        <a className={styles.sanityStudioLogoContainer} href="http://sanity.io">
          <SanityStudioLogo />
        </a>

        <div className={styles.top}>
          <div className={styles.companyLogoContainer}>
            <CompanyLogo />
          </div>
          <div className={styles.menu}>
            <Hamburger>
              <ToolSwitcher tools={tools} activeToolName={router.state.tool} className={styles.toolSwitcher} />
              <LoginStatus className={styles.loginStatus} />
            </Hamburger>
          </div>
        </div>


        <div className={styles.toolContainer}>
          <RouteScope scope={router.state.tool}>
            <RenderTool tool={router.state.tool} />
          </RouteScope>
        </div>


        {absolutes.map((Abs, i) => <Abs key={i} />)}
      </div>
    )
  }
}

export default DefaultLayout
