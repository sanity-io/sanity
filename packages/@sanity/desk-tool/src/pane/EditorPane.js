import PropTypes from 'prop-types'
// Connects the FormBuilder with various sanity roles
import React from 'react'
import styles from './styles/EditorPane.css'
import {getDraftId, getPublishedId} from '../utils/draftUtils'
import FormBuilder, {checkout} from 'part:@sanity/form-builder'
import {throttle, omit} from 'lodash'
import Editor from './Editor'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'

const INITIAL_DOCUMENT_STATE = {
  isSaving: true,
  deletedSnapshot: null,
  snapshot: null
}

const INITIAL_STATE = {
  isLoading: true,
  isSaving: false,
  isCreatingDraft: false,
  draft: INITIAL_DOCUMENT_STATE,
  published: INITIAL_DOCUMENT_STATE
}

function documentEventToState(event) {
  switch (event.type) {
    case 'rebase':
    case 'create':
    case 'createIfNotExists':
    case 'snapshot': {
      return {
        deletedSnapshot: null,
        snapshot: event.document
      }
    }
    case 'mutation': {
      return {
        deletedSnapshot: event.deletedSnapshot,
        snapshot: event.document ? {
          ...event.document,
          // todo: The following line is a temporary workaround for a problem with the mutator not
          // setting updatedAt on patches applied optimistic when they are received from server
          // can be removed when this is fixed
          _updatedAt: new Date().toISOString()
        } : event.document
      }
    }
    default: {
      // eslint-disable-next-line no-console
      console.log('Unhandled document event type "%s"', event.type, event)
      return {}
    }
  }
}

function exists(draft, published) {
  return draft.snapshot || published.snapshot
}

function isRecoverable(draft, published) {
  return !exists(draft, published) && (draft.deletedSnapshot || published.deletedSnapshot)
}

export default class EditorPane extends React.PureComponent {
  static propTypes = {
    documentId: PropTypes.string.isRequired,
    typeName: PropTypes.string.isRequired
  }

  state = INITIAL_STATE

  setup(documentId) {
    this.dispose()
    this.published = checkout(getPublishedId(documentId))
    this.draft = checkout(getDraftId(documentId))

    this.subscription = this.published
      .events.map(event => ({...event, status: 'published'}))
      .merge(
        this.draft.events
          .do(this.receiveDraftEvent)
          .map(event => ({...event, status: 'draft'}))
      )
      .subscribe(event => {
        this.setState(prevState => {
          const key = event.status // either 'draft' or 'published'
          return {
            isLoading: false,
            [key]: {
              ...(prevState[key] || {}),
              ...documentEventToState(event)
            }
          }
        })
      })
  }

  receiveDraftEvent = event => {
    if (event.type !== 'mutation') {
      return
    }
    // Broadcast incoming patches to input components that applies patches on their own
    // Note: This is *experimental*
    FormBuilder.receivePatches({
      patches: event.patches,
      snapshot: event.document
    })
  }

  getDraftId() {
    return getDraftId(this.props.documentId)
  }

  getPublishedId() {
    return getPublishedId(this.props.documentId)
  }

  componentDidMount() {
    this.setup(this.props.documentId)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.documentId !== this.props.documentId) {
      this.setState(INITIAL_STATE)
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
    const {published} = this.state
    if (published.snapshot) {
      this.draft.createIfNotExists({
        ...omit(published.snapshot, '_createdAt', '_updatedAt'),
        _id: this.getDraftId()
      })
      this.draft.commit().subscribe(() => {})
    }

    this.published.delete()
    this.published.commit().subscribe(() => {})
  }

  handlePublish = draft => {

    this.setState({isPublishing: true})

    const publishedId = this.getPublishedId()

    this.published.createOrReplace({
      ...omit(draft, '_createdAt', '_updatedAt'),
      _id: publishedId
    })

    return this.published.commit()
      .mergeMap(() => {
        this.draft.delete()
        return this.draft.commit()
      })
      .subscribe(() =>
        this.setState({isPublishing: false})
      )
  }

  handleChange = event => {
    const {published, draft} = this.state
    const {typeName} = this.props

    if (!draft.snapshot) {
      this.draft.createIfNotExists({
        ...omit(published.snapshot, '_createdAt', '_updatedAt'),
        _id: this.getDraftId(),
        _type: typeName
      })
    }

    this.draft.patch(event.patches)
    this.commit()
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

  handleRestoreDeleted = () => {
    const {draft, published} = this.state

    const commits = []
    if (draft.deletedSnapshot) {
      this.draft.createIfNotExists(draft.deletedSnapshot)
      commits.push(this.draft.commit())
    } else if (published.deletedSnapshot) {
      this.published.createIfNotExists(published.deletedSnapshot)
      commits.push(this.published.commit())
    }
    commits.forEach(c => {
      c.subscribe({
        next: () => {}
      })
    })
  }

  renderDeleted() {
    return (
      <div className={styles.deletedMessage}>
        <h3>This document just got deleted</h3>
        <p>You can undo deleting it until you close this window/tab</p>
        <Button onClick={this.handleRestoreDeleted}>Undo delete</Button>
      </div>
    )
  }

  render() {
    const {typeName} = this.props
    const {draft, isLoading, published, isCreatingDraft, isUnpublishing, isPublishing, isSaving} = this.state

    if (isRecoverable(draft, published)) {
      return this.renderDeleted()
    }

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
