// Connects the FormBuilder with various sanity roles
import React, {PropTypes} from 'react'
import documentStore from 'part:@sanity/base/datastore/document'
import Spinner from 'part:@sanity/components/loading/spinner'
import DefaultButton from 'part:@sanity/components/buttons/default'
import FormBuilder from 'part:@sanity/form-builder'
import {unprefixType} from '../utils/unprefixType'
import dataAspects from '../utils/dataAspects'

import styles from './styles/EditorPane.css'
import * as convertPatch from '../utils/convertPatch'

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

  constructor(props, ...rest) {
    super(props, ...rest)

    this.state = {
      value: FormBuilder.createEmpty(props.typeName),
      progress: null
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleIncomingPatch = this.handleIncomingPatch.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
    this.subscriptions = []
  }

  setupSubscriptions(props) {
    this.tearDownSubscriptions()
    const {documentId, typeName} = props

    this.setState({
      value: FormBuilder.createEmpty(typeName)
    })

    const byId = documentStore.byId(documentId)

    const initialSubscription = byId
      .filter(event => event.type === 'snapshot')
      .subscribe(event => {
        this.setState({
          value: createFormBuilderStateFrom(event.document, typeName)
        })
        initialSubscription.unsubscribe()
      })

    const updateSubscription = byId
      .filter(event => {
        return event.type === 'mutation'
                && event.origin !== 'server' // skip events from server for now
      })
      .subscribe(event => {
        this.handleIncomingPatch(event.patch)
      })

    const deleteSubscription = byId
      .filter(event => event.type === 'delete')
      .subscribe(event => {
        this.handleIncomingDelete(event)
      })

    this.subscriptions = [
      initialSubscription,
      updateSubscription,
      deleteSubscription
    ]
  }

  tearDownSubscriptions() {
    this.subscriptions.forEach(sub => sub.unsubscribe())
  }

  componentWillMount() {
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

  handleChange(event) {
    const id = this.props.documentId

    if (event.patch.local) {
      this.setState({value: this.state.value.patch(event.patch)})
      return
    }
    this.update(id, event.patch)
  }

  handleDelete() {
    const id = this.props.documentId
    this.setState({progress: 'Deleting…'})

    this.subscriptions.push(
      documentStore
        .delete(id)
        .subscribe(result => this.setState({progress: null}))
    )
  }

  update(id, patch) {
    this.setState({progress: 'Saving…'})
    return documentStore
      .update(id, convertPatch.toGradient(patch))
      .subscribe(result => {
        this.setState({progress: null})
      })
  }

  handleIncomingPatch(patch) {
    const formBuilderPatches = convertPatch.toFormBuilder(patch)
    let nextValue = this.state.value
    formBuilderPatches.forEach(fbPatch => {
      nextValue = nextValue.patch(fbPatch)
    })
    this.setState({value: nextValue})
  }

  handleIncomingDelete(event) {
    const {router} = this.context
    router.navigate(omit(router.state, 'action', 'selectedDocumentId'), {replace: true})
  }

  render() {
    const {value, progress, validation} = this.state

    const titleProp = dataAspects.getItemDisplayField(value.getFieldValue('_type'))

    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {value.getFieldValue(titleProp).serialize()}
          </h1>

          <div className={progress ? styles.spinner : styles.spinnerInactive}>
            <Spinner />
          </div>

        </div>
        <form className={styles.editor} onSubmit={preventDefault} id="Sanity_Default_FormBuilder_ScrollContainer">
          <FormBuilder
            value={value}
            validation={validation}
            onChange={this.handleChange}
          />

          <DefaultButton onClick={this.handleDelete} kind="danger">
            Delete
          </DefaultButton>
        </form>
      </div>
    )
  }
}
