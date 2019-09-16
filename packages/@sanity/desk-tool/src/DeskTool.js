import React from 'react'
import PropTypes from 'prop-types'
import {isEqual} from 'lodash'
import {throwError, interval, defer, of as observableOf} from 'rxjs'
import {map, concat, switchMap, distinctUntilChanged, debounce} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'
import client from 'part:@sanity/base/client'
import {withRouterHOC} from 'part:@sanity/base/router'
import {resolvePanes, LOADING} from './utils/resolvePanes'
import styles from './styles/DeskTool.css'
import DeskToolPanes from './DeskToolPanes'
import StructureError from './components/StructureError'
import serializeStructure from './utils/serializeStructure'
import defaultStructure from './defaultStructure'

const EMPTY_PANE_KEYS = []

const hasLoading = panes => panes.some(item => item === LOADING)

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
            PropTypes.shape({
              id: PropTypes.string.isRequired,
              params: PropTypes.object
            })
          ),
          editDocumentId: PropTypes.string,
          legacyEditDocumentId: PropTypes.string,
          type: PropTypes.string,
          action: PropTypes.string
        })
      }).isRequired,
      onPaneChange: PropTypes.func.isRequired
    }

    state = {isResolving: true, panes: null}

    constructor(props) {
      super(props)

      props.onPaneChange([])
    }

    maybeAddEditorPane = (panes, props) => {
      const router = props.router
      const {editDocumentId, type, params = {}} = router.state
      const {template, ...templateParams} = params

      if (!editDocumentId) {
        return observableOf(panes)
      }

      const editor = {
        id: 'editor',
        type: 'document',
        options: {id: editDocumentId, type, template, templateParameters: templateParams}
      }

      if (type !== '*') {
        return observableOf(panes.concat(editor))
      }

      return observableOf(panes.concat(LOADING)).pipe(
        concat(
          client.observable.fetch('*[_id == $id][0]._type', {id: editDocumentId}).pipe(
            map(typeName => {
              router.navigate({...router.state, type: typeName}, {replace: true})
              return panes.concat({...editor, options: {...editor.options, type: typeName}})
            })
          )
        )
      )
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

    derivePanes(props, fromIndex = 0) {
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
          switchMap(panes => this.maybeAddEditorPane(panes, props)),
          debounce(panes => interval(hasLoading(panes) ? 50 : 0))
        )
        .subscribe(this.setResolvedPanes, this.setResolveError)
    }

    shouldDerivePanes = nextProps => {
      const nextRouterState = nextProps.router.state
      const prevRouterState = this.props.router.state
      return (
        !isEqual(nextRouterState.panes, prevRouterState.panes) ||
        nextRouterState.editDocumentId !== prevRouterState.editDocumentId ||
        nextRouterState.legacyEditDocumentId !== prevRouterState.legacyEditDocumentId ||
        nextRouterState.type !== prevRouterState.type ||
        nextRouterState.action !== prevRouterState.action
      )
    }

    // @todo move this out of cWRP - it's deprecated
    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.shouldDerivePanes(nextProps)) {
        const prevPanes = this.props.router.state.panes || []
        const nextPanes = nextProps.router.state.panes || []
        const diffAt = nextPanes.findIndex(
          (id, index) => !prevPanes[index] || prevPanes[index].id !== id
        )
        this.derivePanes(nextProps, diffAt === -1 ? 0 : diffAt)
      }
    }

    componentDidUpdate(prevProps, prevState) {
      if (
        prevProps.onPaneChange !== this.props.onPaneChange ||
        prevState.panes !== this.state.panes
      ) {
        this.props.onPaneChange(this.state.panes || [])
      }
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (this.shouldDerivePanes(nextProps)) {
        return false
      }

      const {router: oldRouter, ...oldProps} = this.props
      const {router: newRouter, ...newProps} = nextProps
      const {panes: oldPanes, ...oldState} = this.state
      const {panes: newPanes, ...newState} = nextState

      return (
        !shallowEquals(oldProps, newProps) ||
        !isEqual(oldPanes, newPanes) ||
        !shallowEquals(oldState, newState)
      )
    }

    maybeHandleOldUrl() {
      const {navigate} = this.props.router
      const {panes, action, legacyEditDocumentId} = this.props.router.state
      if (action === 'edit' && legacyEditDocumentId) {
        navigate({panes: panes.concat([{id: legacyEditDocumentId}])}, {replace: true})
      }
    }

    componentDidMount() {
      this.maybeHandleOldUrl()
      this.derivePanes(this.props)
      this.props.onPaneChange(this.state.panes || [])
    }

    componentWillUnmount() {
      if (this.paneDeriver) {
        this.paneDeriver.unsubscribe()
      }
    }

    getFallbackKeys() {
      const routerState = this.props.router.state
      return routerState.type && routerState.editDocumentId
        ? [`${routerState.type}-${routerState.editDocumentId}`]
        : EMPTY_PANE_KEYS
    }

    render() {
      const {panes, error} = this.state
      if (error) {
        return <StructureError error={error} />
      }

      // @todo include params in keys?
      const routerPanes = this.props.router.state.panes || []
      const keys = routerPanes.map(pane => pane.id) || this.getFallbackKeys()

      return (
        <div className={styles.deskTool}>
          {panes && <DeskToolPanes panes={this.state.panes} keys={keys} autoCollapse />}
        </div>
      )
    }
  }
)

if (__DEV__) {
  if (module.hot) {
    module.hot.dispose(data => {
      data.prevError = prevStructureError
    })
  }
}
