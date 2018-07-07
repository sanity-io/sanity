import React from 'react'
import PropTypes from 'prop-types'
import {get} from 'lodash'
import shallowEquals from 'shallow-equals'
import schema from 'part:@sanity/base/schema'
import {withRouterHOC} from 'part:@sanity/base/router'
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
          return {
            id,
            title: dataAspects.getDisplayName(id),
            type: 'documentList',
            options: {
              filter: '_type == $type',
              params: {type: id}
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
        state: PropTypes.object
      }).isRequired
    }

    state = {}

    constructor(props) {
      super(props)

      this.currentlyMounted = true

      // @todo probably switch to observables?
      this.derivePanes(props)
    }

    derivePanes(props) {
      resolvePanes(structure, props.router.state.panes || [])
        .then(panes => this.setStateIfMounted({panes}))
        .catch(error => this.setStateIfMounted({error}))
    }

    componentDidUpdate(prevProps) {
      if (!shallowEquals(prevProps.router.state.panes, this.props.router.state.panes)) {
        this.derivePanes(this.props)
      }
    }

    componentWillUnmount() {
      this.currentlyMounted = false
    }

    setStateIfMounted = (...args) => {
      return this.currentlyMounted && this.setState(...args)
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
