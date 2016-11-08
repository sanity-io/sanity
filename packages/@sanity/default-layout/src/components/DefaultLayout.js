import React, {PropTypes} from 'react'
import {RouteScope} from '@sanity/state-router'
import config from 'config:sanity'
import tools from 'all:part:@sanity/base/tool'
import absolutes from 'all:part:@sanity/base/absolutes'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import CompanyLogo from 'part:@sanity/base/company-logo?'
import styles from '../../styles/DefaultLayout.css'
import LoginStatus from './LoginStatus'
import ToolSwitcher from './ToolSwitcher'
import RenderTool from './RenderTool'
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
    const projectName = (config.project && config.project.name) || ''

    return (
      <div className={styles.defaultLayout}>

        <a className={styles.sanityStudioLogoContainer} href="http://sanity.io">
          <SanityStudioLogo />
        </a>

        <div className={styles.top}>


          <a href="/" className={styles.companyBranding}>
            <h1 className={CompanyLogo ? styles.projectNameHidden : styles.projectName}>{projectName}</h1>
            {
              CompanyLogo && <div className={styles.companyLogoContainer}><CompanyLogo projectName={projectName} /></div>
            }
          </a>

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
