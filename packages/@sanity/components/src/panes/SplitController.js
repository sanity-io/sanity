import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/SplitController.css'
import SplitPane from 'react-split-pane'
import {debounce} from 'lodash'

const COLLAPSED_WIDTH = 54

export default class PanesSplitController extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    onSholdCollapse: PropTypes.func,
    onSholdExpand: PropTypes.func
  }

  static defaultProps = {
    onSholdCollapse() {},
    onSholdExpand() {}
  }

  isResizing = false

  handleSplitPaneChange = debounce((size, pane) => {
    if (size <= pane.props.minWidth) {
      this.props.onSholdCollapse(pane)
    } else {
      this.props.onSholdExpand(pane)
    }

    this.lastPaneSize = size
  }, 50)

  handleDragStarted = () => {
    this.isResizing = true
  }

  handleDragFinished = () => {
    this.isResizing = false
  }

  renderSplitPane = (pane1, pane2, restMinWidth, restDefaultWidth) => {
    const isCollapsed = pane1.props.isCollapsed

    // Handle size override when collapsing
    let size = isCollapsed ? COLLAPSED_WIDTH : undefined
    if (this.isResizing) {
      size = undefined
    } else if (isCollapsed) {
      size = COLLAPSED_WIDTH
    } else {
      size = pane1.props.defaultWidth
    }

    return (
      <div
        className={`
          ${styles.splitWrapper}
          ${pane2 ? styles.doubleWrapper : styles.singleWrapper}
          ${isCollapsed ? styles.isCollapsed : styles.notCollapsed}
        `}
      >
        <SplitPane
          minSize={isCollapsed ? COLLAPSED_WIDTH : pane1.props.minWidth}
          defaultSize={isCollapsed ? COLLAPSED_WIDTH : pane1.props.defaultWidth}
          size={size}
          resizerClassName={isCollapsed ? styles.ResizerIsCollapsed : styles.Resizer}
          allowResize
          className={styles.splitPane}
          onDragStarted={this.handleDragStarted}
          onDragFinished={this.handleDragFinished}
          onChange={newSize => this.handleSplitPaneChange(newSize, pane1)}
        >
          <div
            className={isCollapsed ? styles.paneInSplittedCollapsed : styles.paneInSplitted}
          >
            {pane1}
          </div>

          {/* <div className={styles.paneInSplitted}></div> */}
          {pane2}

        </SplitPane>
      </div>
    )
  }

  renderRecursivePanes = panes => {
    // only 1 pane left
    if (panes.length === 1) {
      return this.renderSplitPane(panes[0])
    }

    // only 2 panes left
    if (panes.length === 2) {
      return this.renderSplitPane(panes[0], this.renderSplitPane(panes[1]))
    }

    // Recursive
    const remainingPanes = panes.slice(1)
    return this.renderSplitPane(
      panes[0],
      this.renderRecursivePanes(remainingPanes)
    )
  }

  render() {
    const {children} = this.props
    const panes = React.Children.toArray(children)

    if (panes.length === 0) {
      return <div>No panes</div>
    }

    // TODO We need a way to target mobile devices in JS
    // --screen-medium-break: 32em;  ~32 * 16 = 512
    const isMobile = window && window.innerWidth < 512

    return (
      <div className={styles.vertical}>
        {
          isMobile ? children : this.renderRecursivePanes(panes.filter(pane => pane.type !== 'div'))
        }
      </div>
    )
  }
}
