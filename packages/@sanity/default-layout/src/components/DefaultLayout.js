import React from 'react'
import ToolSwitcher from './ToolSwitcher'
import RenderTool from './RenderTool'
import {Router, Route, Redirect} from 'router:@sanity/base/router'
import styles from '../../styles/DefaultLayout.css'
import tools from 'all:tool:@sanity/base/tool'
import absolutes from 'all:component:@sanity/base/absolutes'
import LoginStatus from './LoginStatus'
import Logo from './Logo'
import Hamburger from './Hamburger'

class DefaultLayout extends React.Component {
  render() {
    const activeToolName = this.props.location.pathname.split('/', 2)[1]

    return (
      <div className={styles.defaultLayout}>

        <div className={styles.top}>
          <div className={styles.logoContainer}>
            <Logo />
          </div>
          <div className={styles.menu}>
            <Hamburger>
              <ToolSwitcher tools={tools} activeToolName={activeToolName} className={styles.toolSwitcher} />
              <LoginStatus className={styles.loginStatus} />
            </Hamburger>
          </div>
        </div>


        <div className={styles.toolContainer}>
          <Router>
            <Redirect path="/" to={`/${tools.length ? tools[0].name : ''}`} />
            <Route path="/:tool/*" component={RenderTool} />
          </Router>
        </div>


        {absolutes.map((Abs, i) => <Abs key={i} />)}
      </div>
    )
  }
}

export default DefaultLayout
