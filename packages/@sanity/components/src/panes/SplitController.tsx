import classNames from 'classnames'
import React from 'react'
import SplitPane from 'react-split-pane'
import {childrenToElementArray} from '../helpers'
import styles from './SplitController.css'

interface SplitControllerProps {
  children: React.ReactNode
  collapsedWidth?: number
  isMobile?: boolean
}

export default class PanesSplitController extends React.PureComponent<SplitControllerProps> {
  state = {
    isResizing: false,
  }

  handleDragStarted = () => {
    this.setState({
      isResizing: true,
    })
  }

  handleDragFinished = () => {
    this.setState({
      isResizing: false,
    })
  }

  renderSplitPane = (pane1: React.ReactElement, pane2?: React.ReactElement) => {
    const isCollapsed = pane1.props.isCollapsed
    const {collapsedWidth} = this.props
    const {isResizing} = this.state
    const size = isCollapsed ? collapsedWidth : undefined

    return (
      <div
        className={classNames(
          styles.root,
          isResizing ? styles.splitWrapperResizing : styles.splitWrapper,
          pane2 ? '' : styles.singleWrapper,
          isCollapsed && styles.collapsed
        )}
      >
        <SplitPane
          minSize={isCollapsed ? collapsedWidth : pane1.props.minSize}
          defaultSize={isCollapsed ? collapsedWidth : pane1.props.defaultSize}
          size={size}
          resizerClassName={styles.resizer}
          allowResize={!isCollapsed}
          className={styles.splitPane}
          onDragStarted={this.handleDragStarted}
          onDragFinished={this.handleDragFinished}
        >
          {pane1}
          {pane2 || <div style={{display: 'none'}} />}
        </SplitPane>
      </div>
    )
  }

  renderRecursivePanes = (panes: React.ReactElement[]) => {
    // only 1 pane left
    if (panes.length === 1) {
      return panes[0]
    }

    // only 2 panes left
    if (panes.length === 2) {
      return this.renderSplitPane(panes[0], this.renderSplitPane(panes[1]))
    }

    // Recursive
    const remainingPanes = panes.slice(1)
    return this.renderSplitPane(panes[0], this.renderRecursivePanes(remainingPanes))
  }

  render() {
    const {children, isMobile} = this.props
    const panes = childrenToElementArray(children)

    if (panes.length === 0) {
      return <div>No panes</div>
    }

    return isMobile
      ? children
      : this.renderRecursivePanes(panes.filter((pane) => pane.type !== 'div'))
  }
}
