import React from 'react'
import PropTypes from 'prop-types'
import shallowEquals from 'shallow-equals'
import {withRouterHOC} from 'part:@sanity/base/router'
import structure from 'part:@sanity/desk-tool/structure'
import resolvePanes from './utils/resolvePanes'
import styles from './styles/DeskTool.css'
import DeskToolPanes from './DeskToolPanes'

const EMPTY_PANE_KEYS = []

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

    state = {}

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

    derivePanes(props, addState = {}) {
      const paneIds = props.router.state.panes || []
      return resolvePanes(structure, paneIds || [])
        .then(this.maybeAddEditorPane)
        .then(panes => this.setStateIfMounted({panes, ...addState}))
        .catch(error => this.setStateIfMounted({error, ...addState}))
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (!shallowEquals(nextProps.router.state.panes, this.props.router.state.panes)) {
        this.derivePanes(nextProps)
      }

      if (nextProps.onPaneChange !== this.props.onPaneChange) {
        nextProps.onPaneChange(nextState.panes || [])
      }

      if (nextState.panes !== this.state.panes || nextState.error !== this.state.error) {
        return true
      }

      return false
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
        // @todo probably not?
        return <pre>{error.stack}</pre>
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
