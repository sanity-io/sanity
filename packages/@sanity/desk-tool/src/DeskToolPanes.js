import React from 'react'
import PropTypes from 'prop-types'
import {sumBy} from 'lodash'
import {Observable, merge, of} from 'rxjs'
import {map, mapTo, delay, share, debounceTime, distinctUntilChanged} from 'rxjs/operators'
import {StateLink} from 'part:@sanity/base/router'
import SplitController from 'part:@sanity/components/panes/split-controller'
import SplitPaneWrapper from 'part:@sanity/components/panes/split-pane-wrapper'
import LoadingPane from './pane/LoadingPane'
import Pane from './pane/Pane'
import {PaneRouterContext, LOADING_PANE} from './index'

const COLLAPSED_WIDTH = 55
const BREAKPOINT_SCREEN_MEDIUM = 512

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

function getWaitMessages(path) {
  const thresholds = [{ms: 300, message: 'Loading…'}, {ms: 5000, message: 'Still loading…'}]

  if (__DEV__) {
    const message = [
      'Check console for errors?',
      'Is your observable/promise resolving?',
      path.length > 0 ? `Structure path: ${path.join(' ➝ ')}` : ''
    ]

    thresholds.push({
      ms: 10000,
      message: message.join('\n')
    })
  }

  const src = of(null)
  return merge(
    ...thresholds.map(({ms, message}) =>
      src.pipe(
        mapTo(message),
        delay(ms)
      )
    )
  )
}

// eslint-disable-next-line react/require-optimization
export default class DeskToolPanes extends React.Component {
  static propTypes = {
    keys: PropTypes.arrayOf(PropTypes.string).isRequired,
    groupIndexes: PropTypes.arrayOf(PropTypes.number).isRequired,
    autoCollapse: PropTypes.bool,
    panes: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          params: PropTypes.object
        }),
        PropTypes.symbol
      ])
    ).isRequired,
    router: PropTypes.shape({
      navigate: PropTypes.func.isRequired,
      navigateIntent: PropTypes.func.isRequired,
      state: PropTypes.shape({
        panes: PropTypes.arrayOf(
          PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.string.isRequired,
              params: PropTypes.object
            })
          )
        ),
        editDocumentId: PropTypes.string
      })
    }).isRequired
  }

  static defaultProps = {
    autoCollapse: false
  }

  state = {
    collapsedPanes: [],
    windowWidth: typeof window === 'undefined' ? 1000 : window.innerWidth,
    isMobile: typeof window !== 'undefined' && window.innerWidth < BREAKPOINT_SCREEN_MEDIUM
  }

  userCollapsedPanes = []

  // Memoized copy of contexts
  paneRouterContexts = new Map()

  getPaneRouterContext = (groupIndex, siblingIndex, flatIndex) => {
    const key = `${flatIndex}-${groupIndex}[${siblingIndex}]`
    if (this.paneRouterContexts.has(key)) {
      return this.paneRouterContexts.get(key)
    }

    const modifyCurrentGroup = modifier => {
      const {router} = this.props
      const newPanes = (router.state.panes || []).slice()
      const group = newPanes[groupIndex].slice()
      newPanes.splice(groupIndex, 1, modifier(group, group[siblingIndex]))

      const newRouterState = {...router.state, panes: newPanes}
      router.navigate(newRouterState)
      return newRouterState
    }

    const ctx = {
      // Zero-based index (position) of pane, visually
      index: flatIndex,

      // Zero-based index of pane group (within URL structure)
      groupIndex,

      // Zero-based index of pane within sibling group
      siblingIndex,

      getPayload: () => (this.props.router.state.panes || [])[groupIndex][siblingIndex].payload,

      // Curried StateLink that passes the correct state automatically
      ChildLink: ({childId, childPayload, ...props}) => {
        const oldPanes = this.props.router.state.panes || []
        const panes = oldPanes
          .slice(0, groupIndex + 1)
          .concat([[{id: childId, payload: childPayload}]])

        return <StateLink {...props} state={{panes}} />
      },

      // Get the current pane ID and parameters
      getCurrentPane: () => {
        const routerGroups = this.props.router.state.panes || []
        const routerGroup = routerGroups[groupIndex]
        const routerPane = routerGroup && routerGroup[siblingIndex]
        const childGroup = routerGroups[groupIndex + 1] || []

        return {
          pane: this.props.panes[flatIndex],
          router: routerPane,
          child: childGroup[0],
          siblings: routerGroup
        }
      },

      // Replaces the current pane with a new one
      replaceCurrentPane: (itemId, payload) => {
        const {router} = this.props
        const {editDocumentId} = router.state
        if (editDocumentId) {
          router.navigate({...router.state, editDocumentId: itemId})
        } else {
          modifyCurrentGroup(() => [{id: itemId, payload}])
        }
      },

      // Removes the current pane from the group
      closeCurrentPane: () => {
        modifyCurrentGroup((siblings, item) => siblings.filter(sibling => sibling !== item))
      },

      // Replace or create a child pane with the given id and parameters
      replaceChildPane: (itemId, payload) => {
        const {router} = this.props
        const {editDocumentId, panes} = router.state

        if (editDocumentId) {
          router.navigate({...router.state, editDocumentId: itemId})
        } else {
          const newPanes = panes.slice()
          newPanes.splice(groupIndex + 1, 1, [{id: itemId, payload}])
          router.navigate({...router.state, panes: newPanes})
        }
      },

      // Duplicate the current pane, with optional overrides for item ID and parameters
      duplicateCurrentPane: (itemId, payload, params) => {
        modifyCurrentGroup((siblings, item) => [
          ...siblings,

          {
            ...item,
            id: itemId || item.id,
            payload: payload || item.payload,
            params: params || item.params
          }
        ])
      },

      setPaneView: viewId => {
        modifyCurrentGroup((siblings, item) => {
          const newGroup = siblings.slice()
          const newItem = {...item, params: viewId ? {view: viewId} : {}}
          newGroup.splice(siblingIndex, 1, newItem)
          return newGroup
        })
      },

      getPaneView: () => {
        const panes = this.props.router.state.panes || []
        const group = panes[groupIndex] || []
        const pane = group[siblingIndex]
        const params = pane.params || {}
        return params.view
      },

      // Proxied navigation to a given intent. Consider just exposing `router` instead?
      navigateIntent: this.props.router.navigateIntent
    }

    this.paneRouterContexts.set(key, ctx)
    return ctx
  }

  componentDidUpdate(prevProps) {
    if (this.props.panes.length !== prevProps.panes.length) {
      this.userCollapsedPanes = []
      this.handleAutoCollapse(this.state.windowWidth, undefined, this.userCollapsedPanes)
    }

    // Expand new panes
    const paneToForceExpand = this.props.panes.reduce((acc, pane, i) => {
      return prevProps.panes[i] === pane ? acc : i
    }, undefined)

    if (typeof paneToForceExpand !== 'undefined') {
      this.handleAutoCollapse(this.state.windowWidth, paneToForceExpand, this.userCollapsedPanes)
    }
  }

  componentDidMount() {
    const {autoCollapse, panes} = this.props
    if (autoCollapse) {
      this.resizeSubscriber = windowWidth$.pipe(distinctUntilChanged()).subscribe(windowWidth => {
        this.setState({
          windowWidth,
          isMobile: windowWidth < BREAKPOINT_SCREEN_MEDIUM
        })
        this.handleAutoCollapse(windowWidth, undefined, this.userCollapsedPanes)
      })
      if (window) {
        this.handleAutoCollapse(window.innerWidth, panes.length - 1, this.userCollapsedPanes)
      }
    }
  }

  componentWillUnmount() {
    if (this.props.autoCollapse && this.resizeSubscriber) {
      this.resizeSubscriber.unsubscribe()
    }
  }

  handlePaneCollapse = index => {
    if (this.state.isMobile || this.props.panes.length === 1) {
      return
    }
    this.userCollapsedPanes[index] = true
    this.handleAutoCollapse(this.state.windowWidth, undefined, this.userCollapsedPanes)
  }

  handlePaneExpand = index => {
    if (this.state.isMobile || this.props.panes.length === 1) {
      return
    }
    this.userCollapsedPanes[index] = false
    this.handleAutoCollapse(this.state.windowWidth, index, this.userCollapsedPanes)
  }

  handleAutoCollapse = (windowWidth, paneWantExpand, userCollapsedPanes = []) => {
    const {autoCollapse, panes} = this.props
    const {isMobile} = this.state
    const paneToForceExpand = typeof paneWantExpand === 'number' ? paneWantExpand : panes.length - 1
    if (isMobile || !autoCollapse || !panes || panes.length === 0) {
      return
    }

    const autoCollapsedPanes = []

    const totalMinSize = sumBy(panes, pane => getPaneMinSize(pane))
    let remainingMinSize = totalMinSize

    remainingMinSize -= getPaneMinSize(panes[paneToForceExpand])
    autoCollapsedPanes[paneToForceExpand] = false
    userCollapsedPanes[paneToForceExpand] = false

    if (totalMinSize > windowWidth) {
      panes.forEach((pane, i) => {
        if (paneToForceExpand != i) {
          if (remainingMinSize > windowWidth - getPaneMinSize(panes[paneToForceExpand])) {
            autoCollapsedPanes[i] = true
            remainingMinSize -= getPaneMinSize(pane) - COLLAPSED_WIDTH
          }
        }
      })
    }

    // Respect userCollapsed before autoCollapsed
    const collapsedPanes = panes.map((pane, i) => userCollapsedPanes[i] || autoCollapsedPanes[i])
    this.setState({collapsedPanes})
  }

  renderPanes() {
    const {panes, groupIndexes, keys} = this.props
    const {isMobile} = this.state
    const path = []

    const paneGroups = [['']].concat(this.props.router.state.panes || [])

    let i = -1
    return paneGroups.reduce((components, group, index) => {
      return components.concat(
        group.map((paneId, siblingIndex) => {
          const pane = panes[++i]
          const isCollapsed = Boolean(!isMobile && this.state.collapsedPanes[i])
          const paneKey = `${i}-${keys[i - 1] || 'root'}-${groupIndexes[i - 1]}`

          // Same pane might appear multiple times, so use index as tiebreaker
          const wrapperKey = pane === LOADING_PANE ? `loading-${i}` : `${i}-${pane.id}`
          path.push(pane.id || `[${i}]`)

          return (
            <SplitPaneWrapper
              key={wrapperKey}
              isCollapsed={isCollapsed}
              minSize={getPaneMinSize(pane)}
              defaultSize={getPaneDefaultSize(pane)}
            >
              <PaneRouterContext.Provider
                value={this.getPaneRouterContext(index - 1, siblingIndex, i)}
              >
                {pane === LOADING_PANE ? (
                  <LoadingPane
                    key={paneKey} // Use key to force rerendering pane on ID change
                    path={path}
                    index={i}
                    message={getWaitMessages}
                    onExpand={this.handlePaneExpand}
                    onCollapse={this.handlePaneCollapse}
                    isCollapsed={isCollapsed}
                    isSelected={i === panes.length - 1}
                  />
                ) : (
                  <Pane
                    key={paneKey} // Use key to force rerendering pane on ID change
                    index={i}
                    itemId={keys[i]}
                    onExpand={this.handlePaneExpand}
                    onCollapse={this.handlePaneCollapse}
                    isCollapsed={isCollapsed}
                    isSelected={i === panes.length - 1}
                    isClosable={siblingIndex > 0}
                    {...pane}
                  />
                )}
              </PaneRouterContext.Provider>
            </SplitPaneWrapper>
          )
        })
      )
    }, [])
  }

  render() {
    const {isMobile} = this.state
    return (
      <SplitController
        isMobile={isMobile}
        autoCollapse={this.props.autoCollapse}
        collapsedWidth={COLLAPSED_WIDTH}
        onCheckCollapse={this.handleCheckCollapse}
      >
        {this.renderPanes()}
      </SplitController>
    )
  }
}
