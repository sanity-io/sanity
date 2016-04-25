import React from 'react'
import Header from './Header'
import ToolSwitcher from './ToolSwitcher'
import baseStyles from '../styles/Base.css'
import styles from '../styles/DefaultLayout.css'
import tools from 'all:tool:@sanity/base/tool'
import locationStore from 'datastore:@sanity/base/location'

class DefaultLayout extends React.Component {

  constructor() {
    super()
    this.state = {
      activeToolName: null
    }
  }

  componentDidMount() {
    this.pathSubscription = locationStore
      .state
      .map(event => {
        const [, siteName, toolName] = event.location.pathname.split('/')
        return {
          siteName,
          activeToolName: toolName
        }
      })
      .subscribe({next: state => this.setState(state)})
  }

  componentWillUnmount() {
    this.pathSubscription.unsubscribe()
  }

  renderActiveTool() {
    if (!tools.length) {
      return <div>No tools fulfills the role <code>`tool:@sanity/base/tool`</code></div>
    }

    const {activeToolName} = this.state

    if (!activeToolName) {
      return <div>Select a tool to the left</div>
    }

    const activeTool = tools.find(tool => tool.name === activeToolName)

    if (!activeTool) {
      return <div>Tool not found: {activeToolName}</div>
    }
    return <activeTool.component />
  }

  render() {
    const {activeToolName} = this.state

    return (
      <div className="default-layout">
        <Header />
        <ToolSwitcher tools={tools} activeToolName={activeToolName} />

        <div className={styles.toolContainer}>
          {this.renderActiveTool()}
        </div>
      </div>
    )
  }
}

export default DefaultLayout
