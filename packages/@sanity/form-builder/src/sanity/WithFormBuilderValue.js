// Connects the FormBuilder with various sanity roles
import React, {PropTypes} from 'react'
import documentStore from 'part:@sanity/base/datastore/document'
import FormBuilder from 'part:@sanity/form-builder'
import {throttle} from 'lodash'
import {Patcher} from '@sanity/mutator'
import subscriptionManager from '../utils/subscriptionManager'
import schema from 'part:@sanity/base/schema'
import toGradientPatch from './utils/toGradientPatch'
import arrify from 'arrify'

function getInitialState() {
  return {
    isLoading: true,
    isSaving: false,
    isDeleted: false,
    value: null,
    deletedSnapshot: null
  }
}

export default class WithFormBuilderValue extends React.PureComponent {
  static propTypes = {
    documentId: PropTypes.string,
    typeName: PropTypes.string,
    children: PropTypes.func
  };

  subscriptions = subscriptionManager('documentEvents', 'commit')

  state = getInitialState();

  deserialize(serialized) {
    const {typeName} = this.props
    return serialized
      ? FormBuilder.deserialize(serialized, typeName)
      : FormBuilder.createEmpty(typeName)
  }

  serialize(value) {
    return value.serialize()
  }

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
          value: event.document ? this.deserialize(event.document) : null
        })
        break
      }
      case 'rebase': {
        this.setState({
          value: this.deserialize(event.document)
        })
        break
      }
      case 'mutation': {
        this.handleIncomingMutationEvent(event)
        break
      }
      case 'create': {
        this.setState({
          value: this.deserialize(event.document)
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
    const {mutations} = event
    const operations = []
    mutations.forEach(mutation => {
      if (mutation.create) {
        operations.push(prev => {
          if (prev) {
            throw new Error('Had an unexpected existing document when receiving a create mutation')
          }
          return this.deserialize(mutation.create)
        })
      } else if (mutation.delete) {
        operations.push(() => null)
      } else if (mutation.patch) {
        operations.push(previous => new Patcher(mutation.patch).applyViaAccessor(previous))
      } else {
        // eslint-disable-next-line no-console
        console.error(new Error(`Received unsupported mutation ${JSON.stringify(mutation, null, 2)}`))
      }
    })

    const previousValue = this.state.value
    const nextValue = operations.reduce((prev, operation) => operation(prev), previousValue)

    const isDeleted = nextValue === null
    this.setState({
      isDeleted: isDeleted,
      deletedSnapshot: isDeleted ? this.serialize(previousValue) : null,
      value: nextValue
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

  handleChange = event => {
    this.document.patch(arrify(event.patch).map(toGradientPatch))
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
