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

  handleControllerCollapse = () => {}
  handleControllerUnCollapse = () => {}

  render() {
    const {panes, keys} = this.props
    return (
      <div className={styles.deskToolPanes}>
        <SplitController
          onCollapse={this.handleControllerCollapse}
          onUnCollapse={this.handleControllerUnCollapse}
        >
          {panes.map((pane, i) => (
            <SplitPaneWrapper key={pane.id} defaultWidth={200} isCollapsed={false}>
              <Pane key={i === 0 ? '__root__' : keys[i - 1]} index={i} {...pane} />
            </SplitPaneWrapper>
          ))}
        </SplitController>
      </div>
    )
  }
}
