import React from 'react'
import PropTypes from 'prop-types'
import shallowEquals from 'shallow-equals'
import {withRouterHOC} from 'part:@sanity/base/router'
import resolvePanes from './utils/resolvePanes'
import styles from './styles/DeskTool.css'
import DeskToolPanes from './DeskToolPanes'
import StructureError from './components/StructureError'

const EMPTY_PANE_KEYS = []

// We are lazy-requiring/resolving the structure inside of a function in order to catch errors
// on the root-level of the module. Any loading errors will reject the promise
const loadStructure = () =>
  new Promise((resolve, reject) => {
    const mod = require('part:@sanity/desk-tool/structure')
    const structure = mod && mod.__esModule && mod.default ? mod.default : mod
    if (typeof structure !== 'function') {
      return reject(new Error(`Structure needs to export a function, got ${typeof structure}`))
    }

    if (typeof structure.serialize === 'function') {
      return reject(new Error(`Structure needs to export a function, got builder`))
    }

    return resolve(structure())
  })

const maybeSerialize = structure =>
  typeof structure.serialize === 'function' ? structure.serialize({path: []}) : structure

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

    state = {isResolving: true}

    constructor(props) {
      super(props)

      // @todo probably switch to observables?
      this.derivePanes(props)
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

    derivePanes(props) {
      this.setStateIfMounted({isResolving: true})
      const paneIds = props.router.state.panes || []
      return loadStructure()
        .then(maybeSerialize)
        .then(structure => resolvePanes(structure, paneIds || []))
        .then(this.maybeAddEditorPane)
        .then(panes => this.setStateIfMounted({panes, isResolving: false}))
        .catch(error => this.setStateIfMounted({error, isResolving: false}))
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
      this.currentlyMounted = true

      this.props.onPaneChange(this.state.panes || [])
    }

    componentDidUpdate(prevProps, prevState) {
      if (prevState.panes !== this.state.panes) {
        this.props.onPaneChange(this.state.panes)
      }
    }

    componentWillUnmount() {
      this.currentlyMounted = false
    }

    setStateIfMounted = (state, ...args) => {
      if (this.currentlyMounted) {
        this.setState(state, ...args)
      }

      return state
    }

    render() {
      const {panes, error} = this.state
      if (error) {
        return <StructureError error={error} />
      }

      return (
        <div className={styles.deskTool}>
          {panes ? (
            <DeskToolPanes
              panes={this.state.panes}
              keys={this.props.router.state.panes || EMPTY_PANE_KEYS}
            />
          ) : (
            // @todo proper loading
            <div>Loading</div>
          )}
        </div>
      )
    }
  }
)
