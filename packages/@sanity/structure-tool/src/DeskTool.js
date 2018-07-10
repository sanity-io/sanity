import React from 'react'
import PropTypes from 'prop-types'
import {get} from 'lodash'
import shallowEquals from 'shallow-equals'
import schema from 'part:@sanity/base/schema'
import {withRouterHOC} from 'part:@sanity/base/router'
import PlusIcon from 'part:@sanity/base/plus-icon'
import resolvePanes from './utils/resolvePanes'
import dataAspects from './utils/dataAspects'
import DeskToolPanes from './DeskToolPanes'

const EMPTY_PANE_KEYS = []

const structure = {
  id: '__root__',
  title: 'Content',
  type: 'list',
  resolveChildForItem(itemId, parent) {
    const target = parent.options.items.find(item => item.id === itemId)
    const child = target && target.child
    return typeof child === 'function' ? child(itemId, parent) : child
  },
  options: {
    items: dataAspects
      .getInferredTypes()
      .map(typeName => ({
        id: typeName,
        title: dataAspects.getDisplayName(typeName),
        schemaType: schema.get(typeName),
        child: (id, parent) => {
          const title = dataAspects.getDisplayName(id)
          return {
            id,
            title,
            type: 'documentList',
            options: {
              filter: '_type == $type',
              params: {type: id}
            },
            functions: [
              {
                id: 'createNew',
                title: `Create new ${title}`,
                icon: PlusIcon,
                intent: {type: 'create', params: {type: id}}
              }
            ],
            canHandleIntent(intentName, params) {
              return (
                (intentName === 'edit' && params.id) ||
                (intentName === 'create' && params.type === id)
              )
            },
            resolveChildForItem(documentId, parentItem) {
              return {
                id: 'editor',
                type: 'document',
                options: {
                  id: documentId,
                  type: get(parentItem, 'options.params.type')
                }
              }
            }
          }
        }
      }))
      .concat({
        id: 'mah-singleton',
        title: 'Some singleton',
        child: {
          id: 'editor',
          type: 'document',
          options: {
            id: 'achaeta-aberrans',
            type: 'species'
          }
        }
      })
  }
}

export default withRouterHOC(
  // eslint-disable-next-line react/prefer-stateless-function
  class DeskTool extends React.Component {
    static propTypes = {
      router: PropTypes.shape({
        navigate: PropTypes.func.isRequired,
        state: PropTypes.shape({
          panes: PropTypes.arrayOf(PropTypes.string)
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

    derivePanes(props, addState = {}) {
      const paneIds = props.router.state.panes || []
      return resolvePanes(structure, paneIds)
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
        return <pre>{error.stack}</pre>
      }

      return panes ? (
        <DeskToolPanes
          panes={this.state.panes}
          keys={this.props.router.state.panes || EMPTY_PANE_KEYS}
        />
      ) : (
        <div>Loading</div>
      )
    }
  }
)
