import PropTypes from 'prop-types'
// @flow weak
// Connects the FormBuilder with various sanity roles
import React from 'react'
import documentStore from 'part:@sanity/base/datastore/document'
import FormBuilder from 'part:@sanity/form-builder'
import {throttle} from 'lodash'
import subscriptionManager from '../utils/subscriptionManager'
import schema from 'part:@sanity/base/schema'
import gradientPatchAdapter from './utils/gradientPatchAdapter'
import PatchEvent from '../PatchEvent'

function getInitialState() {
  return {
    isLoading: true,
    isSaving: false,
    isDeleted: false,
    value: null,
    snapshot: null
  }
}

export default class WithFormBuilderValue extends React.PureComponent {
  document: Object

  static propTypes = {
    documentId: PropTypes.string,
    typeName: PropTypes.string,
    children: PropTypes.func
  };

  static childContextTypes = {
    formBuilder: PropTypes.object
  };

  subscriptions = subscriptionManager('documentEvents', 'commit')

  state = getInitialState();

  checkoutDocument(documentId) {
    this.document = documentStore.checkout(documentId)

    this.subscriptions.replace('documentEvents', this.document.events
      .subscribe({
        next: this.handleDocumentEvent,
        // error: this.handleDocumentError
      })
    )
  }

  handleDocumentEvent = event => {
    switch (event.type) {
      case 'snapshot': {
        this.setState({
          isLoading: false,
          value: event.document ? event.document : null
        })
        break
      }
      case 'rebase': {
        this.setState({
          value: event.document
        })
        break
      }
      case 'mutation': {
        this.handleIncomingMutationEvent(event)
        break
      }
      case 'create': {
        this.setState({
          value: event.document
        })
        break
      }
      default: {
        // eslint-disable-next-line no-console
        console.log('Unhandled document event type "%s"', event.type, event)
      }
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribeAll()
  }

  componentWillMount() {
    this.checkoutDocument(this.props.documentId)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.documentId !== this.props.documentId) {
      this.setState(getInitialState())
      this.checkoutDocument(nextProps.documentId)
    }
  }

  handleIncomingMutationEvent(event) {
    const patches = event.mutations.map(mut => mut.patch).filter(Boolean)

    // Broadcast incoming patches to input components that applies patches on their own
    // Note: This is *experimental*
    FormBuilder.receivePatches({
      patches: gradientPatchAdapter.toFormBuilder(event.origin, patches),
      snapshot: event.document
    })

    const isDeleted = (event.document === null || event.document === undefined)
    this.setState({
      isDeleted,
      deletedSnapshot: isDeleted ? this.state.value : null,
      value: event.document
    })
  }
  commit = throttle(() => {
    this.setState({isSaving: true})
    this.subscriptions.replace('commit', this.document.commit().subscribe({
      next: () => {
        // todo
      },
      error: error => {
        // todo
      },
      complete: () => {
        this.setState({isSaving: false})
      }
    }))

  }, 1000, {leading: true, trailing: true})

  handleChange = (event : PatchEvent) => {
    this.document.patch(gradientPatchAdapter.fromFormBuilder(event.patches))
    this.commit()
  }

  handleDelete = () => {
    this.document.delete()
    this.commit()
  }

  handleCreate = document => {
    this.document.create(document)
    this.commit()
  }

  getChildContext() {
    return {
      formBuilder: FormBuilder.context
    }
  }

  render() {
    const {typeName, documentId, children: Component} = this.props
    return (
      <Component
        {...this.state}
        documentId={documentId}
        type={schema.get(typeName)}
        onChange={this.handleChange}
        onDelete={this.handleDelete}
        onCreate={this.handleCreate}
      />
    )
  }
}
