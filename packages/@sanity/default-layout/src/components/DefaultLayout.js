import React, {PropTypes} from 'react'
import {RouteScope, withRouterHOC} from 'part:@sanity/base/router'
import absolutes from 'all:part:@sanity/base/absolutes'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import styles from './styles/DefaultLayout.css'
import RenderTool from './RenderTool'
import DesktopNavigation from './DesktopNavigation'
import MobileNavigation from './MobileNavigation'

export default withRouterHOC(class DefaultLayout extends React.Component {
  static propTypes = {
    router: PropTypes.shape({
      state: PropTypes.object,
      navigate: PropTypes.func
    }),
    tools: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string
    }))
  }

  maybeRedirectToFirstTool() {
    const {router} = this.props
    if (!router.state.tool && this.props.tools.length > 0) {
      router.navigate({tool: this.props.tools[0].name}, {replace: true})
    }
  }

  componentWillMount() {
    this.maybeRedirectToFirstTool()
  }

  componentDidUpdate() {
    this.maybeRedirectToFirstTool()
  }

  render() {
    const {tools, router} = this.props
    return (
      <div className={styles.defaultLayout}>

        <div className={styles.desktopNavigation}>
          <DesktopNavigation tools={tools} />
        </div>

        <div className={styles.mobileNavigation}>
          <MobileNavigation tools={tools} />
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
})
