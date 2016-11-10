// Connects the FormBuilder with various sanity roles
import React, {PropTypes} from 'react'
import documentStore from 'part:@sanity/base/datastore/document'
import Spinner from 'part:@sanity/components/loading/spinner'
import FormBuilder from 'part:@sanity/form-builder'
import {unprefixType} from '../utils/unprefixType'
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
    this.handleIncomingPatch = this.handleIncomingPatch.bind(this)
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
      .first(event => event.type === 'snapshot')
      .subscribe(event => {
        this.setState({
          value: createFormBuilderStateFrom(event.document, typeName)
        })
      })

    const updateSubscription = byId
      .filter(event => event.type === 'mutation')
      .subscribe(event => {
        this.handleIncomingPatch(event.patch)
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

    const id = this.props.documentId

    if (event.patch.local) {
      this.setState({value: this.state.value.patch(event.patch)})
      return
    }
    this.update(id, event.patch)
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
        </form>
      </div>
    )
  }
}
