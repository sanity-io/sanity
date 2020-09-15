import React from 'react'

import styles from './TabList.css'

interface TabListProps {
  children: React.ReactElement[]
}

interface State {
  focusedTabIdx: number
}

// @todo: refactor to functional component
export default class TabList extends React.PureComponent<TabListProps, State> {
  state: State = {
    focusedTabIdx: -1
  }

  handleTabFocus = (tabIdx: number) => {
    this.setState({focusedTabIdx: tabIdx})
  }

  handleKeyDown = (evt: React.KeyboardEvent<HTMLDivElement>) => {
    const numTabs = this.props.children.length

    if (evt.key === 'ArrowLeft') {
      this.setState(state => {
        const focusedTabIdx = state.focusedTabIdx < 1 ? numTabs - 1 : state.focusedTabIdx - 1
        return {focusedTabIdx}
      })
    }

    if (evt.key === 'ArrowRight') {
      this.setState(state => {
        const focusedTabIdx = (state.focusedTabIdx + 1) % numTabs
        return {focusedTabIdx}
      })
    }
  }

  render() {
    const {focusedTabIdx} = this.state

    const children = this.props.children.map((child, idx) => {
      return React.cloneElement(child, {
        isFocused: focusedTabIdx === idx,
        onFocus: () => this.handleTabFocus(idx)
      })
    })

    return (
      <div className={styles.root} onKeyDown={this.handleKeyDown} role="tablist">
        <div>{children}</div>
      </div>
    )
  }
}
