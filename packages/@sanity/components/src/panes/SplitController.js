/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import SplitPane from 'react-split-pane'
import {sumBy} from 'lodash'
import {Observable, merge} from 'rxjs'
import styles from './styles/SplitController.css'
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

export default class PanesSplitController extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    onShouldCollapse: PropTypes.func,
    onShouldExpand: PropTypes.func,
    autoCollapse: PropTypes.bool
  }

  panesToCollapse = []

  state = {
    windowWidth: typeof window === 'undefined' ? 1000 : window.innerWidth,
    isResizing: false
  }

  isResizing = false

  componentDidMount() {
    if (this.props.autoCollapse) {
      this.resizeSubscriber = windowWidth$.pipe(distinctUntilChanged()).subscribe(windowWidth => {
        this.setState({windowWidth})
        this.handleCheckCollapse()
      })
      this.handleCheckCollapse()
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.children.length != this.props.children.length) {
      this.handleCheckCollapse()
    }
  }

  componentWillUnmount() {
    this.resizeSubscriber.unsubscribe()
  }

  handleCheckCollapse = () => {
    const {children, onShouldCollapse, autoCollapse} = this.props
    if (!autoCollapse) {
      return
    }

    const {windowWidth} = this.state
    const panes = React.Children.toArray(children)

    const totalMinSize = sumBy(panes, pane => pane.props.minSize)
    let sumMinSize = totalMinSize

    if (totalMinSize > windowWidth) {
      panes.forEach((pane, i) => {
        if (sumMinSize > windowWidth && i < panes.length - 1) {
          this.panesToCollapse[i] = true
        } else {
          this.panesToCollapse[i] = false
        }
        sumMinSize -= pane.props.minSize - COLLAPSED_WIDTH
      })
      onShouldCollapse(this.panesToCollapse)
    } else {
      // reset
      onShouldCollapse([])
    }
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
    const {isResizing} = this.state

    const size = isCollapsed ? COLLAPSED_WIDTH : undefined

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
          minSize={isCollapsed ? COLLAPSED_WIDTH : pane1.props.minSize}
          defaultSize={isCollapsed ? COLLAPSED_WIDTH : pane1.props.defaultSize}
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
    const {children} = this.props
    const panes = React.Children.toArray(children)

    if (panes.length === 0) {
      return <div>No panes</div>
    }

    // TODO We need a way to target mobile devices in JS
    // --screen-medium-break: 32em;  ~32 * 16 = 512
    const isLessThanScreenMedium = this.state.windowWidth < 512

    return isLessThanScreenMedium
      ? children
      : this.renderRecursivePanes(panes.filter(pane => pane.type !== 'div'))
  }
}
