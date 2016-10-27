// Connects the FormBuilder with various sanity roles
import React, {PropTypes} from 'react'
import documentStore from 'part:@sanity/base/datastore/document'
import Spinner from 'part:@sanity/components/loading/spinner'
import FormBuilder from 'part:@sanity/form-builder'
import {unprefixType} from '../utils/unprefixType'
import schema from 'part:@sanity/base/schema'
import dataAspects from '../utils/dataAspects'

import styles from './styles/EditorPane.css'
import * as convertPatch from '../utils/convertPatch'

const preventDefault = ev => ev.preventDefault()

function createFormBuilderStateFrom(serialized, typeName) {
  return serialized ? FormBuilder.deserialize(unprefixType(serialized), typeName) : FormBuilder.createEmpty(typeName)
}
const noop = () => {}

export default class EditorPane extends React.PureComponent {
  static propTypes = {
    documentId: PropTypes.string,
    onCreated: PropTypes.func,
    onUpdated: PropTypes.func,
    typeName: PropTypes.string
  };
  static defaultProps = {
    onCreated: noop,
    onUpdated: noop,
  };

  constructor(props, ...rest) {
    super(props, ...rest)

    this.state = {
      value: FormBuilder.createEmpty(props.typeName),
      progress: null
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleDocPatch = this.handleDocPatch.bind(this)
    this.subscriptions = []
  }

  setupSubscriptions(props) {
    this.tearDownSubscriptions()
    const {documentId, typeName} = props

    const exists = documentId && documentId.split('/')[1]
    this.setState({
      value: FormBuilder.createEmpty(typeName)
    })

    if (!exists) {
      return
    }

    const byId = documentStore.byId(documentId)
    const initialSubscription = byId
      .first(event => event.type === 'snapshot')
      .subscribe(event => {
        this.setState({
          value: createFormBuilderStateFrom(event.document, typeName)
        })
      })

    const updateSubscription = byId
      .filter(event => event.type === 'update')
      .subscribe(event => {
        this.handleDocPatch(event.patch)
      })

    this.subscriptions = [initialSubscription, updateSubscription]
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

    const id = this.state.value.getFieldValue('_id')

    if (id) {
      this.update(id, event.patch)
    } else {
      this.create(event.patch)
    }
  }

  update(id, patch) {
    this.setState({progress: 'Saving…'})
    return documentStore
      .update(id, convertPatch.toGradient(patch))
      .subscribe(result => {
        this.setState({progress: null})
      })
  }

  create(patch) {
    if (this.creating) {
      return null
    }
    const {typeName, onCreated} = this.props
    const prefixedType = `${schema.name}.${typeName}`
    const nextValue = this.state.value.patch(patch)
    this.creating = true
    this.setState({progress: 'Creating…'})

    return documentStore
      .create(Object.assign(nextValue.serialize(), {_type: prefixedType}))
      .subscribe(result => {
        this.setState({progress: null})
        onCreated({_id: result.documentId})
      })
  }

  handleDocPatch(patch) {
    const formBuilderPatches = convertPatch.toFormBuilder(patch)
    let nextValue = this.state.value
    formBuilderPatches.forEach(fbPatch => {
      nextValue = nextValue.patch(fbPatch)
    })
    this.setState({value: nextValue})
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
        <form className={styles.editor} onSubmit={preventDefault}>
          <FormBuilder
            value={value}
            validation={validation}
            onChange={this.handleChange}
          />
        </form>
      </div>
    )
  }
}
