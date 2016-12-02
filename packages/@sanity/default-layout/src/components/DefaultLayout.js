import React, {PropTypes} from 'react'
import {RouteScope} from 'part:@sanity/base/router'
import absolutes from 'all:part:@sanity/base/absolutes'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import styles from './styles/DefaultLayout.css'
import RenderTool from './RenderTool'
import DesktopNavigation from './DesktopNavigation'
import MobileNavigation from './MobileNavigation'
import tools from 'all:part:@sanity/base/tool'

class DefaultLayout extends React.Component {
  static contextTypes = {
    router: PropTypes.object,
  }

  maybeRedirectToFirstTool() {
    const {router} = this.context
    if (!router.state.tool && tools.length > 0) {
      router.navigate({tool: tools[0].name}, {replace: true})
    }
  }

  componentWillMount() {
    this.maybeRedirectToFirstTool()
  }

  componentDidUpdate() {
    this.maybeRedirectToFirstTool()
  }

  render() {
    const {router} = this.context
    return (
      <div className={styles.defaultLayout}>

        <div className={styles.desktopNavigation}>
          <DesktopNavigation />
        </div>

        <div className={styles.mobileNavigation}>
          <MobileNavigation />
        </div>

        <div className={styles.toolContainer}>
          <RouteScope scope={router.state.tool}>
            <RenderTool tool={router.state.tool} />
          </RouteScope>
        </div>

        <a className={styles.sanityStudioLogoContainer} href="http://sanity.io">
          <SanityStudioLogo />
        </a>

        {absolutes.map((Abs, i) => <Abs key={i} />)}
      </div>
    )
  }
}

export default DefaultLayout
