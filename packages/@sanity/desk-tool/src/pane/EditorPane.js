// Connects the FormBuilder with various sanity roles
import React, {PropTypes} from 'react'
import documentStore from 'part:@sanity/base/datastore/document'
import Spinner from 'part:@sanity/components/loading/spinner'
import DefaultButton from 'part:@sanity/components/buttons/default'
import FormBuilder from 'part:@sanity/form-builder'
import {unprefixType} from '../utils/unprefixType'
import dataAspects from '../utils/dataAspects'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {debounce} from 'lodash'

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

function createFormBuilderStateFrom(serialized, typeName) {
  return serialized ? FormBuilder.deserialize(unprefixType(serialized), typeName) : FormBuilder.createEmpty(typeName)
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

  state = {
    loading: true,
    spin: false,
    progress: {kind: 'info', message: 'Loading'}
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
    const {typeName} = this.props

    switch (event.type) {
      case 'snapshot': {
        this.setState({
          loading: false,
          progress: null,
          value: createFormBuilderStateFrom(event.document, typeName)
        })
        break
      }
      case 'rebase': {
        this.setState({
          value: createFormBuilderStateFrom(event.document, typeName)
        })
        break
      }
      case 'mutate': {
        this.handleIncomingMutation(event.mutations)
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
      this.setupSubscriptions(nextProps)
    }
  }

  handleIncomingMutation(mutations) {
    const patches = mutations
      .filter(mut => 'patch' in mut)
      .map(mut => mut.patch)

    let nextValue = this.state.value
    patches.forEach(patch => {
      nextValue = new Patcher(patch).applyViaAccessor(nextValue)
    })
    this.setState({value: nextValue})
  }


  handleIncomingDelete(event) {
    const {router} = this.context
    router.navigate(omit(router.state, 'action', 'selectedDocumentId'), {replace: true})
  }

  commit = debounce(() => {
    this.setState({spin: true, progress: null})
    this.document.commit().subscribe({
      next: () => {
        this.setState({progress: {kind: 'success', message: 'Saved…'}})
      },
      error: err => {
        setTimeout(this.commit, 1000)
        this.setState({progress: {kind: 'error', message: `Save failed ${err.message}`}})
      },
      complete: () => {
        this.setState({spin: false})
      }
    })
  }, 1000)

  handleChange = event => {
    this.document
      .patch(event.patches)
    this.commit()
  }

  handleDelete = () => {
    const id = this.props.documentId
    this.setState({progress: {kind: 'info', message: 'Deleting…'}})

    this.subscriptions.push(
      documentStore
        .delete(id)
        .subscribe(result => {
          this.setState({progress: {kind: 'success', message: 'Deleted…'}})
        })
    )
  }

  render() {
    const {value, loading, spin, progress, validation} = this.state
    const {typeName} = this.props

    const titleProp = dataAspects.getItemDisplayField(typeName)

    if (loading) {
      return (
        <div className={styles.root}>
          <div className={styles.spinner}>
            <Spinner />
          </div>
        </div>
      )
    }

    return (
      <div className={styles.root}>
        {
          // Test for the snackbar. Needs a messaging system
          progress && <Snackbar kind={progress.kind}>{progress.message}</Snackbar>
        }

        <div className={styles.header}>
          <h1 className={styles.title}>
            {value.getAttribute(titleProp).serialize() || 'Untitled…'}
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

          <DefaultButton onClick={this.handleDelete} color="danger">
            Delete
          </DefaultButton>
        </form>
      </div>
    )
  }
}
