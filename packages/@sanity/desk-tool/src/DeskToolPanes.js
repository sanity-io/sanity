import React from 'react'
import PropTypes from 'prop-types'
import {sumBy} from 'lodash'
import SplitController from 'part:@sanity/components/panes/split-controller'
import SplitPaneWrapper from 'part:@sanity/components/panes/split-pane-wrapper'
import {LOADING} from './utils/resolvePanes'
import LoadingPane from './pane/LoadingPane'
import Pane from './pane/Pane'
import {Observable, merge} from 'rxjs'
import {map, share, debounceTime, distinctUntilChanged} from 'rxjs/operators'

const COLLAPSED_WIDTH = 54

const fromWindowEvent = eventName =>
  new Observable(subscriber => {
    const handler = event => subscriber.next(event)
    window.addEventListener(eventName, handler)
    return () => {
      window.removeEventListener(eventName, handler)
    }
  })

const orientationChange$ = fromWindowEvent('orientationchange')
const resize$ = fromWindowEvent('resize')

const windowWidth$ = merge(orientationChange$, resize$).pipe(
  share(),
  debounceTime(50),
  map(() => window.innerWidth)
)

function getPaneMinSize(pane) {
  return pane.type === 'document' ? 500 : 320
}

function getPaneDefaultSize(pane) {
  return pane.type === 'document' ? 672 : 350
}

export default class DeskToolPanes extends React.Component {
  static propTypes = {
    keys: PropTypes.arrayOf(PropTypes.string).isRequired,
    autoCollapse: PropTypes.bool,
    panes: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.shape({
          id: PropTypes.string.isRequired
        }),
        PropTypes.symbol
      ])
    ).isRequired
  }

  state = {
    collapsedPanes: [],
    windowWidth: typeof window === 'undefined' ? 1000 : window.innerWidth
  }

  collapsedPanes = []
  userCollapsedPanes = []

  componentDidUpdate(prevProps) {
    if (this.props.panes.length != prevProps.panes.length) {
      const paneToForceExpand = this.props.panes.length - 1
      this.userCollapsedPanes = []
      this.handleAutoCollapse(this.state.windowWidth, paneToForceExpand, this.userCollapsedPanes)
    }
  }

  componentDidMount() {
    const {autoCollapse, panes} = this.props
    const paneToForceExpand = panes.length - 1
    if (autoCollapse) {
      this.resizeSubscriber = windowWidth$.pipe(distinctUntilChanged()).subscribe(windowWidth => {
        this.setState({windowWidth})
        this.handleAutoCollapse(windowWidth, paneToForceExpand, this.userCollapsedPanes)
      })
      if (window) {
        this.handleAutoCollapse(window.innerWidth, paneToForceExpand, this.userCollapsedPanes)
      }
    }
  }

  componentWillUnmount() {
    if (this.props.autoCollapse && this.resizeSubscriber) {
      this.resizeSubscriber.unsubscribe()
    }
  }

  handlePaneCollapse = index => {
    this.userCollapsedPanes[index] = true
    const paneToForceExpand = this.props.panes.length - 1
    this.handleAutoCollapse(this.state.windowWidth, paneToForceExpand, this.userCollapsedPanes)
  }

  handlePaneExpand = index => {
    this.userCollapsedPanes[index] = false
    this.handleAutoCollapse(this.state.windowWidth, index, this.userCollapsedPanes)
  }

  handleAutoCollapse = (windowWidth, paneToForceExpand, userCollapsedPanes = []) => {
    const {autoCollapse, panes} = this.props

    if (!autoCollapse || !panes || panes.length === 0) {
      return
    }

    const autoCollapsedPanes = []

    const totalMinSize = sumBy(panes, pane => getPaneMinSize(pane))
    let remainingMinSize = totalMinSize
    const hasForceExpand = typeof paneToForceExpand === 'number' && panes[paneToForceExpand]

    if (hasForceExpand) {
      remainingMinSize -= getPaneMinSize(panes[paneToForceExpand]) - COLLAPSED_WIDTH
      autoCollapsedPanes[paneToForceExpand] = false
    }

    if (totalMinSize > windowWidth) {
      panes.forEach((pane, i) => {
        if (paneToForceExpand != i) {
          if (remainingMinSize + getPaneMinSize(pane) + COLLAPSED_WIDTH > windowWidth) {
            autoCollapsedPanes[i] = true
            remainingMinSize -= getPaneMinSize(pane) - COLLAPSED_WIDTH
          }
        }
      })
    }

    // Respect userCollapsed before autoCollapsed
    this.setState({
      collapsedPanes: panes.map((pane, i) => userCollapsedPanes[i] || autoCollapsedPanes[i])
    })
  }

  renderPanes() {
    const {panes, keys} = this.props
    const path = []

    return panes.map((pane, i) => {
      const isCollapsed = this.state.collapsedPanes[i]
      const paneKey = `${i}-${keys[i - 1] || 'root'}`

      // Same pane might appear multiple times, so use index as tiebreaker
      const wrapperKey = pane === LOADING ? `loading-${i}` : `${i}-${pane.id}`
      path.push(pane.id || `[${i}]`)

      return (
        <SplitPaneWrapper
          key={wrapperKey}
          isCollapsed={!!isCollapsed}
          minSize={getPaneMinSize(pane)}
          defaultSize={getPaneDefaultSize(pane)}
        >
          {pane === LOADING ? (
            <LoadingPane
              key={paneKey} // Use key to force rerendering pane on ID change
              path={path}
              index={i}
              onExpand={this.handlePaneExpand}
              onCollapse={this.handlePaneCollapse}
              isCollapsed={!!isCollapsed}
              isSelected={i === panes.length - 1}
            />
          ) : (
            <Pane
              key={paneKey} // Use key to force rerendering pane on ID change
              index={i}
              itemId={keys[i - 1]}
              onExpand={this.handlePaneExpand}
              onCollapse={this.handlePaneCollapse}
              isCollapsed={!!isCollapsed}
              isSelected={i === panes.length - 1}
              {...pane}
            />
          )}
        </SplitPaneWrapper>
      )
    })
  }

  render() {
    const isLessThanScreenMedium = this.state.windowWidth < 512
    return (
      <SplitController
        isMobile={isLessThanScreenMedium}
        autoCollapse={this.props.autoCollapse}
        collapsedWidth={COLLAPSED_WIDTH}
        onCheckCollapse={this.handleCheckCollapse}
      >
        {this.renderPanes()}
      </SplitController>
    )
  }
}
