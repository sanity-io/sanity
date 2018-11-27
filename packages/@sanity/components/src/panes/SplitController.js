/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import SplitPane from 'react-split-pane'
import styles from './styles/SplitController.css'

export default class PanesSplitController extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    onCheckCollapse: PropTypes.func,
    autoCollapse: PropTypes.bool,
    collapsedWidth: PropTypes.number,
    isMobile: PropTypes.bool
  }

  state = {
    isResizing: false
  }

  handleDragStarted = () => {
    this.setState({
      isResizing: true
    })
  }

  handleDragFinished = () => {
    this.setState({
      isResizing: false
    })
  }

  renderSplitPane = (pane1, pane2, restMinSize, restDefaultSize) => {
    const isCollapsed = pane1.props.isCollapsed
    const {collapsedWidth} = this.props
    const {isResizing} = this.state

    const size = isCollapsed ? collapsedWidth : undefined

    return (
      <div
        className={`
          ${styles.vertical}
          ${isResizing ? styles.splitWrapperResizing : styles.splitWrapper}
          ${pane2 ? '' : styles.singleWrapper}
          ${isCollapsed ? styles.isCollapsed : styles.notCollapsed}
        `}
      >
        <SplitPane
          minSize={isCollapsed ? collapsedWidth : pane1.props.minSize}
          defaultSize={isCollapsed ? collapsedWidth : pane1.props.defaultSize}
          size={size}
          resizerClassName={isCollapsed ? styles.ResizerIsCollapsed : styles.Resizer}
          allowResize={!isCollapsed}
          className={styles.splitPane}
          onDragStarted={this.handleDragStarted}
          onDragFinished={this.handleDragFinished}
        >
          {pane1}
          {pane2 || ' '}
        </SplitPane>
      </div>
    )
  }

  renderRecursivePanes = panes => {
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
    const panes = React.Children.toArray(children)

    if (panes.length === 0) {
      return <div>No panes</div>
    }

    return isMobile
      ? children
      : this.renderRecursivePanes(panes.filter(pane => pane.type !== 'div'))
  }
}
