// Connects the FormBuilder with various sanity roles
import React, {PropTypes} from 'react'
import documentStore from 'part:@sanity/base/datastore/document'
import Spinner from 'part:@sanity/components/loading/spinner'
import DefaultButton from 'part:@sanity/components/buttons/default'
import FormBuilder from 'part:@sanity/form-builder'
import schemaTypePrefix from '../utils/schemaTypePrefix'
import schema from 'part:@sanity/base/schema'
import dataAspects from '../utils/dataAspects'
import {throttle} from 'lodash'

import styles from './styles/EditorPane.css'
import {Patcher} from '@sanity/mutator'

const preventDefault = ev => ev.preventDefault()

function omit(source, ...keys) {
  return Object.keys(source)
    .reduce((target, key) => {
      if (keys.includes(key)) {
        return target
      }
      target[key] = source[key]
      return target
    }, {})
}

function getInitialState() {
  return {
    loading: true,
    spin: false,
    deleted: null,
    progress: {kind: 'info', message: 'Loading'}
  }
}


export default class EditorPane extends React.PureComponent {
  static contextTypes = {
    router: PropTypes.object
  };

  static propTypes = {
    documentId: PropTypes.string,
    typeName: PropTypes.string
  };

  subscriptions = [];

  state = getInitialState();

  get schemaTypePrefix() {
    if (!this._schemaTypePrefix) {
      this._schemaTypePrefix = schemaTypePrefix(schema)
    }
    return this._schemaTypePrefix
  }

  deserialize(serialized) {
    const {typeName} = this.props
    return serialized
      ? FormBuilder.deserialize(this.schemaTypePrefix.removeFrom(serialized), typeName)
      : FormBuilder.createEmpty(typeName)
  }

  serialize(value) {
    return this.schemaTypePrefix.addTo(value.serialize())
  }

  setupSubscriptions(props) {
    this.tearDownSubscriptions()
    const {documentId} = props

    this.document = documentStore.checkout(documentId)

    const documentEvents = this.document.events.subscribe({
      next: this.handleDocumentEvent,
      error: this.handleDocumentError
    })

    this.subscriptions = [documentEvents]
  }

  handleDocumentError = error => {
    this.setState({progress: {kind: 'error', message: error.message}})
  }

  handleDocumentEvent = event => {
    switch (event.type) {
      case 'snapshot': {
        this.setState({
          loading: false,
          progress: null,
          value: this.deserialize(event.document)
        })
        break
      }
      case 'rebase': {
        this.setState({
          value: this.deserialize(event.document)
        })
        break
      }
      case 'mutate': {
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

  tearDownSubscriptions() {
    this.subscriptions.forEach(sub => sub.unsubscribe())
  }

  componentDidMount() {
    this.setupSubscriptions(this.props)
  }

  componentWillUnmount() {
    this.tearDownSubscriptions()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.documentId !== this.props.documentId) {
      this.setState(getInitialState())
      this.setupSubscriptions(nextProps)
    }
  }

  handleIncomingMutationEvent(event) {
    const {mutations, origin} = event
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
        // Handle deletions after the fact
        if (origin !== 'local') {
          operations.push(() => null)
        }
      } else if (mutation.patch) {
        operations.push(previous => new Patcher(mutation.patch).applyViaAccessor(previous))
      } else {
        // eslint-disable-next-line no-console
        console.error(new Error(`Received unsupported mutation ${JSON.stringify(mutation, null, 2)}`))
      }
    })

    const previousValue = this.state.value
    const nextValue = operations.reduce((prev, operation) => operation(prev), previousValue)

    this.setState({
      deleted: nextValue === null ? this.serialize(previousValue) : null,
      value: nextValue
    })
  }
  handleIncomingDelete(event) {
    const {router} = this.context
    router.navigate(omit(router.state, 'action', 'selectedDocumentId'), {replace: true})
  }
  commit = throttle(() => {
    this.setState({spin: true, progress: null})
    this.document.commit().subscribe({
      next: () => {
        this.setState({progress: {kind: 'success', message: 'Saved…'}})
      },
      error: err => {
        this.setState({progress: {kind: 'error', message: `Save failed ${err.message}`}})
      },
      complete: () => {
        this.setState({spin: false})
      }
    })
  }, 1000, {leading: true, trailing: true})

  handleChange = event => {
    this.document
      .patch(event.patches)
    this.commit()
  }

  handleDelete = () => {
    this.setState({progress: {kind: 'info', message: 'Deleting…'}})
    this.document.delete()
    this.commit()
  }

  handleRestore = () => {
    const {deleted} = this.state
    this.setState({progress: {kind: 'info', message: 'Restoring…'}})
    this.document.create(deleted)
    this.commit()
  }

  render() {
    const {value, deleted, loading, spin, validation} = this.state
    const {typeName} = this.props
    const titleProp = dataAspects.getItemDisplayField(typeName)
    const schemaType = schema.types.find(type => type.name === this.props.typeName)

    if (loading) {
      return (
        <div className={styles.root}>
          <Spinner center message={`Loading ${schemaType.title}…`} />
        </div>
      )
    }

    if (deleted) {
      return (
        <div className={styles.root}>
          <p>Document was deleted</p>
          <DefaultButton onClick={this.handleRestore}>Restore</DefaultButton>
        </div>
      )
    }

    return (
      <div className={styles.root}>

        <h2 className={styles.typeTitle}>{schemaType.title}</h2>

        <div className={styles.header}>
          <h1 className={styles.title}>
            {(titleProp && value.getAttribute(titleProp).serialize()) || 'Untitled…'}
          </h1>

          <div className={spin ? styles.spinner : styles.spinnerInactive}>
            <Spinner />
          </div>

        </div>
        <form className={styles.editor} onSubmit={preventDefault} id="Sanity_Default_FormBuilder_ScrollContainer">
          <FormBuilder
            value={value}
            validation={validation}
            onChange={this.handleChange}
          />

          <div className={styles.deleteContainer}>
            <DefaultButton onClick={this.handleDelete} color="danger">
              <strong>Delete</strong> {value.getAttribute(titleProp).serialize()}
            </DefaultButton>
          </div>
        </form>
      </div>
    )
  }
}
