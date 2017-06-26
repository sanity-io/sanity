import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/SplitController.css'
import SplitPane from 'react-split-pane'
import {sumBy, debounce} from 'lodash'

export default class PanesSplitController extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    onCollapse: PropTypes.func,
    onUnCollapse: PropTypes.func
  }

  handleSplitPaneChange = debounce((size, pane) => {
    if (size <= pane.props.minWidth) {
      this.props.onCollapse(pane)
    } else {
      this.props.onUnCollapse(pane)
    }
  }, 100)

  renderSplitPane = (pane1, pane2, restMinWidth, restDefaultWidth) => {
    const isCollapsed = pane1.props.isCollapsed
    return (
      <SplitPane
        minSize={!isCollapsed && pane1.props.minWidth}
        defaultSize={!isCollapsed && pane1.props.defaultWidth}
        size={isCollapsed ? 52 : undefined}
        resizerClassName={isCollapsed ? styles.ResizerIsCollapsed : styles.Resizer}
        allowResize={!pane1.props.isCollapsed}
        onChange={size => this.handleSplitPaneChange(size, pane1)}
      >
        <div className={isCollapsed ? styles.paneInSplittedCollapsed : styles.paneInSplitted}>{pane1}</div>
        <div className={styles.paneInSplitted}>{pane2}</div>
      </SplitPane>
    )
  }

  renderRecursivePanes = panes => {
    // only 1 pane left
    if (panes.length === 1) {
      return panes[0]
    }

    // only 2 panes left
    if (panes.length === 2) {
      return this.renderSplitPane(panes[0], panes[1])
    }

    // Recursive
    const remainingPanes = panes.slice(1)
    return this.renderSplitPane(
      panes[0],
      this.renderRecursivePanes(remainingPanes),
      sumBy(remainingPanes, 'props.minWidth'),
      sumBy(remainingPanes, 'props.defaultWidth')
    )
  }

  render() {
    const {children} = this.props
    const panes = React.Children.toArray(children).map(pane => {

      // Find wrapped pane until react 16
      if (pane.type == 'div' && typeof (pane.props.children) === 'object' && pane.props.children.length === undefined) {
        return pane.props.children
      }

      return pane
    })

    if (panes.length === 0) {
      return <div>No panes</div>
    }

    return (
      <div className={styles.vertical}>
        {this.renderRecursivePanes(panes.filter(pane => pane.type !== 'div'))}
      </div>
    )
  }
}
