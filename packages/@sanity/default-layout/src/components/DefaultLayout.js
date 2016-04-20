import React from 'react'
import Header from './Header'
import ToolSwitcher from './ToolSwitcher'
import baseStyles from '../styles/Base.css'
import styles from '../styles/DefaultLayout.css'
import tools from 'all:tool:@sanity/base/tool'

const NoTools = () =>
  <div>No tools fulfills the role <code>`tool:@sanity/base/tool`</code></div>

class DefaultLayout extends React.Component {
  render() {
    const ActiveTool = tools.length ? tools[0] : NoTools

    return (
      <div className="default-layout">
        <Header />
        <ToolSwitcher tools={tools} />

        <div className={styles.toolContainer}>
          <ActiveTool />
        </div>
      </div>
    )
  }
}

export default DefaultLayout
