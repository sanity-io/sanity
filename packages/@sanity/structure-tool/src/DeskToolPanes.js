import React from 'react'
import PropTypes from 'prop-types'
import SplitController from 'part:@sanity/components/panes/split-controller'
import SplitPaneWrapper from 'part:@sanity/components/panes/split-pane-wrapper'
import styles from './styles/DeskTool.css'
import Pane from './pane/Pane'

export default class DeskToolPanes extends React.Component {
  static propTypes = {
    keys: PropTypes.arrayOf(PropTypes.string).isRequired,
    panes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired
      })
    ).isRequired
  }

  state = {collapsedPanes: []}

  handleControllerCollapse = pane => {
    console.log('ctrl collapse', pane)
  }

  handleControllerUnCollapse = pane => {
    console.log('ctrl uncollapse', pane)
  }

  handlePaneExpand = index => {
    this.setState(prevState => ({
      collapsedPanes: prevState.collapsedPanes.filter(idx => idx !== index)
    }))
  }

  handlePaneCollapse = index => {
    this.setState(prevState => ({
      collapsedPanes: prevState.collapsedPanes.concat(index)
    }))
  }

  render() {
    const {panes, keys} = this.props
    return (
      <div className={styles.deskToolPanes}>
        <SplitController
          onShouldCollapse={this.handleControllerCollapse}
          onShouldExpand={this.handleControllerUnCollapse}
        >
          {panes.map((pane, i) => {
            const isCollapsed = this.state.collapsedPanes.includes(i)
            return (
              <SplitPaneWrapper key={pane.id} defaultWidth={200} isCollapsed={isCollapsed}>
                <Pane
                  key={i === 0 ? '__root__' : keys[i - 1]}
                  index={i}
                  onExpand={this.handlePaneExpand}
                  onCollapse={this.handlePaneCollapse}
                  isCollapsed={isCollapsed}
                  {...pane}
                />
              </SplitPaneWrapper>
            )
          })}
        </SplitController>
      </div>
    )
  }
}
