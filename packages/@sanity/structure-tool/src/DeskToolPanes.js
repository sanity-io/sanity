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

  componentDidUpdate(prevProps) {
    if (this.props.panes.length < prevProps.panes.length) {
      const cutoff = this.props.panes.length - 1
      // @todo figure out how to do this outside of componentDidUpdate - we
      // want to track the changing of pane depth and "reset" the collapsed
      // state of any pane that is deeper than the current depth. Doing this
      // in getDerivedStateFromProps() does work as you cannot reference the
      // previous props, and cutting of at the current depth will disallow
      // the last pane open from being collapsed
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState(state => ({
        collapsedPanes: state.collapsedPanes.filter(index => index < cutoff)
      }))
    }
  }

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

  renderPanes() {
    const {panes, keys} = this.props

    // @todo improve message
    if (panes.length === 0) {
      return (
        <SplitPaneWrapper>
          <div>Configure some panes, first!</div>
        </SplitPaneWrapper>
      )
    }

    return panes.map((pane, i) => {
      // Same pane might appear multiple times, so use index as tiebreaker
      const paneKey = `${i}-${keys[i - 1] || 'root'}`
      const wrapperKey = `${i}-${pane.id}`
      const isCollapsed = this.state.collapsedPanes.includes(i)
      return (
        <SplitPaneWrapper key={wrapperKey} defaultWidth={200} isCollapsed={isCollapsed}>
          <Pane
            key={paneKey} // Use key to force rerendering pane on ID change
            index={i}
            onExpand={this.handlePaneExpand}
            onCollapse={this.handlePaneCollapse}
            isCollapsed={isCollapsed}
            {...pane}
          />
        </SplitPaneWrapper>
      )
    })
  }

  render() {
    return (
      <div className={styles.deskToolPanes}>
        <SplitController
          onShouldCollapse={this.handleControllerCollapse}
          onShouldExpand={this.handleControllerUnCollapse}
        >
          {this.renderPanes()}
        </SplitController>
      </div>
    )
  }
}
