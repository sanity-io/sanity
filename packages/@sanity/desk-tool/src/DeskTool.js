import React from 'react'
import PropTypes from 'prop-types'
import {throwError, from, of, interval} from 'rxjs'
import {map, switchMap, distinctUntilChanged, debounce} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'
import {withRouterHOC} from 'part:@sanity/base/router'
import {resolvePanes, LOADING} from './utils/resolvePanes'
import styles from './styles/DeskTool.css'
import DeskToolPanes from './DeskToolPanes'
import StructureError from './components/StructureError'
import isSubscribable from './utils/isSubscribable'
import defaultStructure from './defaultStructure'

const EMPTY_PANE_KEYS = []

const hasLoading = panes => panes.some(item => item === LOADING)

// We are lazy-requiring/resolving the structure inside of a function in order to catch errors
// on the root-level of the module. Any loading errors will be caught and emitted as errors
const loadStructure = () => {
  let getStructure
  try {
    const mod = require('part:@sanity/desk-tool/structure?') || defaultStructure
    getStructure = mod && mod.__esModule ? mod.default : mod
  } catch (err) {
    return throwError(err)
  }

  if (typeof getStructure !== 'function') {
    return throwError(new Error(`Structure needs to export a function, got ${typeof getStructure}`))
  }

  if (typeof getStructure.serialize === 'function') {
    return throwError(new Error(`Structure needs to export a function, got builder`))
  }

  let structure
  try {
    structure = getStructure()
  } catch (err) {
    return throwError(err)
  }

  return isSubscribable(structure) ? from(structure) : of(structure)
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
          panes: PropTypes.arrayOf(PropTypes.string),
          editDocumentId: PropTypes.string,
          type: PropTypes.string
        })
      }).isRequired,
      onPaneChange: PropTypes.func.isRequired
    }

    state = {isResolving: true, panes: null}

    constructor(props) {
      super(props)

      props.onPaneChange([])
    }

    maybeAddEditorPane = panes => {
      const {editDocumentId, type} = this.props.router.state
      if (!editDocumentId) {
        return panes
      }

      return panes.concat({
        id: 'editor',
        type: 'document',
        options: {id: editDocumentId, type}
      })
    }

    setResolvedPanes = panes => {
      const router = this.props.router
      const paneIds = router.state.panes || []
      this.setState({panes, isResolving: false})

      if (panes.length < paneIds.length) {
        router.navigate({...router.state, panes: paneIds.slice(0, panes.length)}, {replace: true})
      }
    }

    setResolveError = error => this.setState({error, isResolving: false})

    derivePanes(props) {
      if (this.paneDeriver) {
        this.paneDeriver.unsubscribe()
      }

      this.setState({isResolving: true})
      this.paneDeriver = loadStructure()
        .pipe(
          distinctUntilChanged(),
          map(maybeSerialize),
          switchMap(structure => resolvePanes(structure, props.router.state.panes || [])),
          debounce(panes => interval(hasLoading(panes) ? 50 : 0)),
          map(this.maybeAddEditorPane)
        )
        .subscribe(this.setResolvedPanes, this.setResolveError)
    }

    shouldComponentUpdate(nextProps, nextState) {
      // @todo move this ouit of sCU - cWRP is deprecated, gDSFP does not have previous props
      if (!shallowEquals(nextProps.router.state.panes, this.props.router.state.panes)) {
        this.derivePanes(nextProps)
      }

      if (nextProps.onPaneChange !== this.props.onPaneChange) {
        nextProps.onPaneChange(nextState.panes || [])
      }

      return !shallowEquals(nextState, this.state)
    }

    componentDidMount() {
      this.derivePanes(this.props)
      this.props.onPaneChange(this.state.panes || [])
    }

    componentDidUpdate(prevProps, prevState) {
      if (prevState.panes !== this.state.panes) {
        this.props.onPaneChange(this.state.panes)
      }
    }

    componentWillUnmount() {
      if (this.paneDeriver) {
        this.paneDeriver.unsubscribe()
      }
    }

    render() {
      const {panes, error} = this.state
      if (error) {
        return <StructureError error={error} />
      }

      return (
        <div className={styles.deskTool}>
          {panes && (
            <DeskToolPanes
              panes={this.state.panes}
              keys={this.props.router.state.panes || EMPTY_PANE_KEYS}
            />
          )}
        </div>
      )
    }
  }
)
