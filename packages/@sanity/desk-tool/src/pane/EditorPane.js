import PropTypes from 'prop-types'
// Connects the FormBuilder with various sanity roles
import React from 'react'
import styles from './styles/EditorPane.css'
import {getDraftId, getPublishedId} from '../utils/draftUtils'
import {checkout, patches} from 'part:@sanity/form-builder'
import {throttle} from 'lodash'
import Editor from './Editor'
import schema from 'part:@sanity/base/schema'
import documentStore from 'part:@sanity/base/datastore/document'

const INITIAL_DOCUMENT_STATE = {
  isSaving: true,
  isLoading: true,
  isDeleted: false,
  snapshot: null
}

function documentEventToState(currentState, event) {
  switch (event.type) {
    case 'rebase':
    case 'create':
    case 'snapshot': {
      return {snapshot: event.document}
    }
    case 'mutation': {
      return mutationEventToState(currentState, event)
    }
    default: {
      // eslint-disable-next-line no-console
      console.log('Unhandled document event type "%s"', event.type, event)
      return {}
    }
  }
}

function mutationEventToState(currentState, event) {
  const isDeleted = (event.document === null || event.document === undefined)
  return {
    isDeleted,
    deletedSnapshot: isDeleted ? currentState.value : null,
    snapshot: event.document
  }
}

export default class EditorPane extends React.PureComponent {
  static propTypes = {
    documentId: PropTypes.string.isRequired,
    typeName: PropTypes.string.isRequired
  }

  state = {
    isSaving: false,
    isCreatingDraft: false,
    draft: INITIAL_DOCUMENT_STATE,
    published: INITIAL_DOCUMENT_STATE
  }

  setup(documentId) {
    this.dispose()
    this.published = checkout(getPublishedId(documentId))
    this.draft = checkout(getDraftId(documentId))

    this.subscription = this.published
      .events.map(event => ({...event, status: 'published'}))
      .merge(this.draft.events.map(event => ({...event, status: 'draft'})))
      .subscribe(event => {
        this.setState(currentState => {
          const key = event.status // either 'draft' or 'published'
          return {[key]: documentEventToState(currentState[key], event)}
        })
      })
  }

  componentDidMount() {
    this.setup(this.props.documentId)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.documentId !== this.props.documentId) {
      this.setState(INITIAL_DOCUMENT_STATE)
      this.setup(nextProps.documentId)
    }
  }

  componentWillUnmount() {
    this.dispose()
  }

  dispose() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
    this.published = null
    this.draft = null
  }

  handleDiscardDraft = () => {
    this.draft.delete()
    this.draft.commit().subscribe(() => {
      // todo: error handling
    })
  }

  handleDelete = () => {
    this.setState({isDeleting: true})
    this.draft.delete()
    this.published.delete()
    this.draft.commit().merge(this.published.commit())
      .subscribe(() => {
        this.setState({isDeleting: false})
      })
  }

  handleUnpublish = () => {
    const {draft, published} = this.state

    const del = () => {
      this.published.delete()
      return this.published.commit()
    }

    const restoringDraft = !draft.snapshot && this.createDraftFrom(published.snapshot)

    this.setState({isUnpublishing: true})
    return (restoringDraft
      ? restoringDraft.mergeMap(() => del())
      : del())
      .subscribe(() => {
        this.setState({isUnpublishing: false})
      })
  }

  handlePublish = draft => {
    const {published} = this.state

    this.setState({isPublishing: true})

    const publishing = published.snapshot
      ? this.overWritePublishedWith(draft)
      : this.createPublishedFrom(draft)

    return publishing
      .mergeMap(() => {
        this.draft.delete()
        return this.draft.commit()
      })
      .subscribe(() =>
        this.setState({isPublishing: false})
      )
  }

  createPublishedFrom(draft) {
    const publishedId = getPublishedId(draft._id)
    const publishedDocument = {
      ...draft,
      _id: publishedId
    }

    // TODO: if buffered document would be able to handle starting with empty document, we could just do
    // this.published.createIfNotExists(...), apply the patch and be done with it
    // Currently the Squashing buffer fails when current snapshot is undefined
    return documentStore.createIfNotExists(publishedDocument)
      .do(result => this.setup(this.props.documentId))
  }

  overWritePublishedWith(draft) {
    this.published.patch([patches.set({
      ...draft,
      _id: getPublishedId(draft._id)
    })])
    return this.published.commit()
  }

  createDraftFrom(document) {
    const draftId = getDraftId(document._id)
    const draftDocument = {
      ...document,
      _id: draftId
    }

    // TODO: if buffered document would be able to handle starting with empty document, we could just do
    // this.published.createIfNotExists(...), apply the patch and be done with it
    // Currently the Squashing buffer fails when current snapshot is undefined
    return documentStore.createIfNotExists(draftDocument)
      .do(result => this.setup(this.props.documentId))
  }

  overWriteDraftWith(document) {
    this.draft.patch([patches.set({
      ...document,
      _id: getDraftId(document._id)
    })])
    return this.draft.commit()
  }

  handleChange = event => {
    const {draft, published} = this.state

    if (draft.snapshot) {
      // all good
      this.draft.patch(event.patches)
      this.commit()
      return
    }

    this.setState({isCreatingDraft: true})

    this.createDraftFrom(published.snapshot)
      .mergeMap(() => {
        this.draft.patch(event.patches)
        return this.draft.commit()
      })
      .subscribe(() => {
        this.setState({isCreatingDraft: false})
      })
  }

  commit = throttle(() => {
    this.setState({isSaving: true})
    this.draft.commit().subscribe({
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

  }, 1000, {leading: true, trailing: true})

  render() {
    const {typeName} = this.props
    const {draft, published, isCreatingDraft, isUnpublishing, isPublishing, isSaving} = this.state
    const isLoading = draft.isLoading || published.isLoading
    return (
      <div className={styles.root}>
        <Editor
          type={schema.get(typeName)}
          published={published.snapshot}
          draft={draft.snapshot}
          isLoading={isLoading}
          isSaving={isSaving}
          isPublishing={isPublishing}
          isUnpublishing={isUnpublishing}
          isCreatingDraft={isCreatingDraft}
          onDelete={this.handleDelete}
          onDiscardDraft={this.handleDiscardDraft}
          onPublish={this.handlePublish}
          onUnpublish={this.handleUnpublish}
          onChange={this.handleChange}
        />
      </div>
    )
  }
}
