import PropTypes from 'prop-types'
import React from 'react'
import {throttle} from 'lodash'
import subscriptionManager from '../utils/subscriptionManager'
import PatchEvent from '../PatchEvent'
import {checkout} from './formBuilderValueStore'
import SanityFormBuilderContext from './SanityFormBuilderContext'

type State = {
  isLoading: boolean
  isSaving: boolean
  value: any | null
  deletedSnapshot: any | null
}
type Props = {
  documentId: string
  typeName: string
  schema: Record<string, any>
  children: React.ComponentType<any>
}

function getInitialState(): State {
  return {
    isLoading: true,
    isSaving: false,
    value: null,
    deletedSnapshot: null
  }
}

type WithFormBuilderValueState = State & {
  deletedSnapshot: any
  value: any
} & State

export default class WithFormBuilderValue extends React.PureComponent<
  Props,
  WithFormBuilderValueState
> {
  document: Record<string, any>
  static childContextTypes = {
    formBuilder: PropTypes.object
  }
  subscriptions = subscriptionManager('documentEvents', 'commit')
  state = getInitialState()
  patchChannel = SanityFormBuilderContext.createPatchChannel()

  checkoutDocument(documentId: string) {
    this.document = checkout(documentId)
    this.subscriptions.replace(
      'documentEvents',
      this.document.events.subscribe({
        next: this.handleDocumentEvent
        // error: this.handleDocumentError
      })
    )
  }

  handleDocumentEvent = (event: {type: string; document: any}) => {
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

  UNSAFE_componentWillMount() {
    this.checkoutDocument(this.props.documentId)
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (nextProps.documentId !== this.props.documentId) {
      this.setState(getInitialState())
      this.checkoutDocument(nextProps.documentId)
    }
  }

  handleIncomingMutationEvent(event: any) {
    // Broadcast incoming patches to input components that applies patches on their own
    // Note: This is *experimental* and likely to change in the near future
    this.patchChannel.receivePatches({
      patches: event.patches,
      snapshot: event.document
    })
    this.setState({
      deletedSnapshot: event.deletedSnapshot,
      value: event.document
    })
  }

  commit = throttle(
    () => {
      this.setState({isSaving: true})
      this.subscriptions.replace(
        'commit',
        this.document.commit().subscribe({
          next: () => {
            // todo
          },
          error: error => {
            // todo
          },
          complete: () => {
            this.setState({isSaving: false})
          }
        })
      )
    },
    1000,
    {leading: true, trailing: true}
  )
  handleChange = (event: PatchEvent) => {
    this.document.createIfNotExists({
      _id: this.props.documentId,
      _type: this.props.typeName
    })
    this.document.patch(event.patches)
    this.commit()
  }
  handleDelete = () => {
    this.document.delete()
    this.commit()
  }
  handleCreate = (document: any) => {
    this.document.create(document)
    this.commit()
  }

  render() {
    const {typeName, documentId, schema, children: Component} = this.props
    const {isLoading, isSaving, value, deletedSnapshot} = this.state
    return (
      <SanityFormBuilderContext value={value} schema={schema} patchChannel={this.patchChannel}>
        <Component
          value={value}
          isLoading={isLoading}
          isSaving={isSaving}
          deletedSnapshot={deletedSnapshot}
          documentId={documentId}
          type={schema.get(typeName)}
          onChange={this.handleChange}
          onDelete={this.handleDelete}
          onCreate={this.handleCreate}
        />
      </SanityFormBuilderContext>
    )
  }
}
