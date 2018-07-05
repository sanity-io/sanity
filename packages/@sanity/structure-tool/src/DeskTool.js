import React from 'react'
import PropTypes from 'prop-types'
import {get} from 'lodash'
import shallowEquals from 'shallow-equals'
import schema from 'part:@sanity/base/schema'
import {withRouterHOC} from 'part:@sanity/base/router'
import PlusIcon from 'part:@sanity/base/plus-icon'
import SortIcon from 'part:@sanity/base/sort-icon'
import ListIcon from 'part:@sanity/base/bars-icon'
import DetailsIcon from 'part:@sanity/base/th-list-icon'
import MenuDivider from 'part:@sanity/components/menus/divider'
import resolvePanes from './utils/resolvePanes'
import dataAspects from './utils/dataAspects'
import styles from './styles/DeskTool.css'
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
              params: {type: id},
              defaultOrdering: [{field: 'title', direction: 'asc'}]
            },
            functions: [
              {
                action: 'createNew',
                title: `Create new ${title}`,
                icon: PlusIcon,
                intent: {type: 'create', params: {type: id}}
              }
            ],
            menuItems: [
              {
                action: 'setSortOrder',
                title: 'Sort by Created',
                icon: SortIcon,
                params: {by: [{field: '_createdAt', direction: 'desc'}]}
              },
              {
                action: 'setSortOrder',
                title: 'Sort by Last edited',
                icon: SortIcon,
                params: {by: [{field: '_updatedAt', direction: 'desc'}]}
              },
              MenuDivider,
              {
                action: 'setLayout',
                title: 'List',
                icon: ListIcon,
                params: {layout: 'default'}
              },
              {
                action: 'setLayout',
                title: 'Details',
                icon: DetailsIcon,
                params: {layout: 'detail'}
              },
              MenuDivider,
              {
                action: 'createNew',
                title: 'Create new…',
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
