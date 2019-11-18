import React from 'react'
import PropTypes from 'prop-types'
import {isEqual} from 'lodash'
import {throwError, interval, defer, of} from 'rxjs'
import {map, switchMap, distinctUntilChanged, debounce} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'
import {withRouterHOC} from 'part:@sanity/base/router'
import {resolvePanes} from './utils/resolvePanes'
import styles from './styles/DeskTool.css'
import DeskToolPanes from './DeskToolPanes'
import StructureError from './components/StructureError'
import serializeStructure from './utils/serializeStructure'
import isNarrowScreen from './utils/isNarrowScreen'
import windowWidth$ from './utils/windowWidth'
import defaultStructure from './defaultStructure'
import {LOADING_PANE} from './index'

const EMPTY_PANE_KEYS = []

const hasLoading = panes => panes.some(item => item === LOADING_PANE)

const isStructure = structure => {
  return (
    structure &&
    (typeof structure === 'function' ||
      typeof structure.serialize !== 'function' ||
      typeof structure.then !== 'function' ||
      typeof structure.subscribe !== 'function' ||
      typeof structure.type !== 'string')
  )
}

let prevStructureError = null
if (__DEV__) {
  if (module.hot && module.hot.data) {
    prevStructureError = module.hot.data.prevError
  }
}

// We are lazy-requiring/resolving the structure inside of a function in order to catch errors
// on the root-level of the module. Any loading errors will be caught and emitted as errors
// eslint-disable-next-line complexity
const loadStructure = () => {
  let structure
  try {
    const mod = require('part:@sanity/desk-tool/structure?') || defaultStructure
    structure = mod && mod.__esModule ? mod.default : mod

    // On invalid modules, when HMR kicks in, we sometimes get an empty object back when the
    // source has changed without fixing the problem. In this case, keep showing the error
    if (
      __DEV__ &&
      prevStructureError &&
      structure &&
      structure.constructor.name === 'Object' &&
      Object.keys(structure).length === 0
    ) {
      return throwError(prevStructureError)
    }

    prevStructureError = null
  } catch (err) {
    prevStructureError = err
    return throwError(err)
  }

  if (!isStructure(structure)) {
    return throwError(
      new Error(
        `Structure needs to export a function, an observable, a promise or a stucture builder, got ${typeof structure}`
      )
    )
  }

  // Defer to catch immediately thrown errors on serialization
  return defer(() => serializeStructure(structure))
}

const maybeSerialize = structure =>
  structure && typeof structure.serialize === 'function'
    ? structure.serialize({path: []})
    : structure

export default withRouterHOC(
  // eslint-disable-next-line react/prefer-stateless-function
  class DeskTool extends React.Component {
    static propTypes = {
      router: PropTypes.shape({
        navigate: PropTypes.func.isRequired,
        state: PropTypes.shape({
          panes: PropTypes.arrayOf(
            PropTypes.arrayOf(
              PropTypes.shape({
                id: PropTypes.string.isRequired,
                params: PropTypes.object
              })
            )
          ),
          legacyEditDocumentId: PropTypes.string,
          type: PropTypes.string,
          action: PropTypes.string
        })
      }).isRequired,
      onPaneChange: PropTypes.func.isRequired
    }

    state = {isResolving: true, hasNarrowScreen: isNarrowScreen(), panes: null}

    constructor(props) {
      super(props)

      props.onPaneChange([])
    }

    setResolvedPanes = panes => {
      const router = this.props.router
      const paneSegments = router.state.panes || []

      this.setState({panes, isResolving: false})

      if (panes.length < paneSegments.length) {
        router.navigate(
          {...router.state, panes: paneSegments.slice(0, panes.length)},
          {replace: true}
        )
      }
    }

    setResolveError = error => {
      prevStructureError = error

      // Log error for proper stacktraces
      console.error(error) // eslint-disable-line no-console

      this.setState({error, isResolving: false})
    }

    derivePanes(props, fromIndex = [0, 0]) {
      if (this.paneDeriver) {
        this.paneDeriver.unsubscribe()
      }

      this.setState({isResolving: true})
      this.paneDeriver = loadStructure()
        .pipe(
          distinctUntilChanged(),
          map(maybeSerialize),
          switchMap(structure =>
            resolvePanes(structure, props.router.state.panes || [], this.state.panes, fromIndex)
          ),
          switchMap(panes =>
            hasLoading(panes) ? of(panes).pipe(debounce(() => interval(50))) : of(panes)
          )
        )
        .subscribe(this.setResolvedPanes, this.setResolveError)
    }

    calcPanesEquality = (prev = [], next = []) => {
      if (prev === next) {
        return {ids: true, params: true}
      }

      if (prev.length !== next.length) {
        return {ids: false, params: false}
      }

      let paramsDiffer = false
      const idsEqual = prev.every((prevGroup, index) => {
        const nextGroup = next[index]
        if (prevGroup.length !== nextGroup.length) {
          return false
        }

        return prevGroup.every((prevPane, paneIndex) => {
          const nextPane = nextGroup[paneIndex]

          paramsDiffer =
            paramsDiffer ||
            !isEqual(nextPane.params, prevPane.params) ||
            !isEqual(nextPane.payload, prevPane.payload)

          return nextPane.id === prevPane.id
        })
      })

      return {ids: idsEqual, params: !paramsDiffer}
    }

    panesAreEqual = (prev, next) => this.calcPanesEquality(prev, next).ids

    shouldDerivePanes = (nextProps, prevProps) => {
      const nextRouterState = nextProps.router.state
      const prevRouterState = prevProps.router.state

      return (
        !this.panesAreEqual(prevRouterState.panes, nextRouterState.panes) ||
        nextRouterState.legacyEditDocumentId !== prevRouterState.legacyEditDocumentId ||
        nextRouterState.type !== prevRouterState.type ||
        nextRouterState.action !== prevRouterState.action
      )
    }

    componentDidUpdate(prevProps, prevState) {
      if (
        prevProps.onPaneChange !== this.props.onPaneChange ||
        prevState.panes !== this.state.panes
      ) {
        this.props.onPaneChange(this.state.panes || [])
      }

      const prevPanes = prevProps.router.state.panes || []
      const nextPanes = this.props.router.state.panes || []
      const panesEqual = this.calcPanesEquality(prevPanes, nextPanes)

      if (!panesEqual.ids && this.shouldDerivePanes(this.props, prevProps)) {
        const diffAt = getPaneDiffIndex(nextPanes, prevPanes)

        if (diffAt) {
          this.derivePanes(this.props, diffAt)
        }
      }
    }

    shouldComponentUpdate(nextProps, nextState) {
      const {router: oldRouter, ...oldProps} = this.props
      const {router: newRouter, ...newProps} = nextProps
      const {panes: oldPanes, ...oldState} = this.state
      const {panes: newPanes, ...newState} = nextState
      const prevPanes = oldRouter.state.panes || []
      const nextPanes = newRouter.state.panes || []
      const panesEqual = this.calcPanesEquality(prevPanes, nextPanes)

      const shouldUpdate =
        !panesEqual.params ||
        !panesEqual.ids ||
        !shallowEquals(oldProps, newProps) ||
        !isEqual(oldPanes, newPanes) ||
        !shallowEquals(oldState, newState)

      return shouldUpdate
    }

    maybeHandleOldUrl() {
      const {navigate} = this.props.router
      const {panes, action, legacyEditDocumentId} = this.props.router.state
      if (action === 'edit' && legacyEditDocumentId) {
        navigate({panes: panes.concat([{id: legacyEditDocumentId}])}, {replace: true})
      }
    }

    maybeCutSiblingPanes() {
      const {hasNarrowScreen} = this.state
      if (!hasNarrowScreen) {
        return
      }

      const {navigate} = this.props.router
      const panes = this.props.router.state.panes || []
      const hasSiblings = panes.some(group => group.length > 1)
      if (!hasSiblings) {
        return
      }

      const withoutSiblings = panes.map(group => [group[0]])
      navigate({panes: withoutSiblings}, {replace: true})
    }

    componentDidMount() {
      this.resizeSubscriber = windowWidth$.subscribe(() => {
        const hasNarrowScreen = isNarrowScreen()
        if (this.state.hasNarrowScreen !== hasNarrowScreen) {
          this.setState({hasNarrowScreen: isNarrowScreen()}, this.maybeCutSiblingPanes)
        }
      })

      this.maybeCutSiblingPanes()
      this.maybeHandleOldUrl()
      this.derivePanes(this.props)
      this.props.onPaneChange(this.state.panes || [])
    }

    componentWillUnmount() {
      if (this.paneDeriver) {
        this.paneDeriver.unsubscribe()
      }

      if (this.resizeSubscriber) {
        this.resizeSubscriber.unsubscribe()
      }
    }

    render() {
      const {router} = this.props
      const {panes, error} = this.state
      if (error) {
        return <StructureError error={error} />
      }

      const keys =
        (router.state.panes || []).reduce(
          (ids, group) => ids.concat(group.map(sibling => sibling.id)),
          []
        ) || EMPTY_PANE_KEYS

      const groupIndexes = (router.state.panes || []).reduce(
        (ids, group) => ids.concat(group.map((sibling, groupIndex) => groupIndex)),
        []
      )

      return (
        <div className={styles.deskTool}>
          {panes && (
            <DeskToolPanes
              router={router}
              panes={this.state.panes}
              keys={keys}
              groupIndexes={groupIndexes}
              autoCollapse
            />
          )}
        </div>
      )
    }
  }
)

function getPaneDiffIndex(nextPanes, prevPanes) {
  if (!nextPanes.length) {
    return [0, 0]
  }

  const maxPanes = Math.max(nextPanes.length, prevPanes.length)
  for (let index = 0; index < maxPanes; index++) {
    const nextGroup = nextPanes[index]
    const prevGroup = prevPanes[index]

    // Whole group is now invalid
    if (!prevGroup || !nextGroup) {
      return [index, 0]
    }

    // Less panes than previously? Resolve whole group
    if (prevGroup.length > nextGroup.length) {
      return [index, 0]
    }

    /* eslint-disable max-depth */
    // Iterate over siblings
    for (let splitIndex = 0; splitIndex < nextGroup.length; splitIndex++) {
      const nextSibling = nextGroup[splitIndex]
      const prevSibling = prevGroup[splitIndex]

      // Didn't have a sibling here previously, diff from here!
      if (!prevSibling) {
        return [index, splitIndex]
      }

      // Does the ID differ from the previous?
      if (nextSibling.id !== prevSibling.id) {
        return [index, splitIndex]
      }
    }
    /* eslint-enable max-depth */
  }

  // "No diff"
  return undefined
}

if (__DEV__) {
  if (module.hot) {
    module.hot.dispose(data => {
      data.prevError = prevStructureError
    })
  }
}
