import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/SplitController.css'
import Pane from './DefaultPane'
import SplitPane from 'react-split-pane'
import {sumBy, debounce} from 'lodash'

export default class PanesSplitController extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    selectedIndex: PropTypes.number,
    onChange: PropTypes.func
  }

  constructor(props) {
    super()
    this.state = {
      collapsedPanes: []
    }
  }

  handleSplitPaneChange = debounce((size, pane) => {
    const {collapsedPanes} = this.state
    if (size <= pane.props.minWidth) {
      collapsedPanes.push(pane)
      this.setState({
        collapsedPanes: collapsedPanes
      })
      console.log('collapse')
    } else {
      this.setState({
        collapsedPanes: collapsedPanes.filter(collapsedPane => {
          return collapsedPane !== pane
        })
      })
    }
  }, 100)

  renderSplitPane = (pane1, pane2, restMinWidth, restDefaultWidth) => {
    return (
      <SplitPane
        primary="first"
        minSize={restMinWidth || pane1.props.minWidth}
        defaultSize={restDefaultWidth || pane1.props.defaultWidth}
        split="vertical"
        resizerClassName={styles.Resizer}
        onChange={size => this.handleSplitPaneChange(size, pane1)}
      >
        <div className={styles.paneInSplitted}>{pane1}</div>
        <div className={styles.paneInSplitted}>{pane2}</div>
      </SplitPane>
    )
  }

  renderPaneElement = (pane, collapsedPanes) => {
    const isCollapsed = collapsedPanes.find(collapsedPane => pane === collapsedPane)
    console.log('compare', collapsedPanes[0], pane, collapsedPanes[0] === pane)
    return (
      <Pane {...pane.props} isCollapsed={isCollapsed} />
    )
  }

  renderRecursivePanes = (panes, collapsedPanes) => {
    // only 1 pane left
    if (panes.length === 1) {
      return this.renderPaneElement(panes[0], collapsedPanes)
    }

    // only 2 panes left
    if (panes.length === 2) {
      return this.renderSplitPane(
        this.renderPaneElement(panes[0], collapsedPanes),
        this.renderPaneElement(panes[1], collapsedPanes)
      )
    }

    // Recursive
    const remainingPanes = panes.slice(1)
    return this.renderSplitPane(
      this.renderPaneElement(panes[0], collapsedPanes),
      this.renderRecursivePanes(remainingPanes, collapsedPanes),
      sumBy(remainingPanes, 'props.minWidth'),
      sumBy(remainingPanes, 'props.defaultWidth')
    )
  }

  render() {
    const {children} = this.props
    const panes = React.Children.toArray(children)
    const {collapsedPanes} = this.state
    return (
      <div className={styles.vertical}>
        {this.renderRecursivePanes(panes, collapsedPanes)}
      </div>
    )
  }
}
