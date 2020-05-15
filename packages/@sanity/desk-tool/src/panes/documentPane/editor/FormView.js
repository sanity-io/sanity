import React from 'react'
import PropTypes from 'prop-types'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import Button from 'part:@sanity/components/buttons/default'
import schema from 'part:@sanity/base/schema'
import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
import filterFieldFn$ from 'part:@sanity/desk-tool/filter-fields-fn?'
import styles from '../Editor.css'
import EditForm from './EditForm'
import HistoryForm from './HistoryForm'
import {setLocation} from 'part:@sanity/base/datastore/presence'

const noop = () => undefined

const INITIAL_STATE = {
  focusPath: [],
  filterField: () => true
}

export default class FormView extends React.PureComponent {
  static propTypes = {
    id: PropTypes.string,
    patchChannel: PropTypes.object,
    document: PropTypes.shape({
      draft: PropTypes.shape({_id: PropTypes.string, _type: PropTypes.string}),
      published: PropTypes.shape({_id: PropTypes.string, _type: PropTypes.string}),
      displayed: PropTypes.shape({_id: PropTypes.string, _type: PropTypes.string})
    }).isRequired,
    headerHeight: PropTypes.number.isRequired,
    initialValue: PropTypes.shape({_type: PropTypes.string}),
    isConnected: PropTypes.bool,
    isNarrowScreen: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    schemaType: PropTypes.shape({name: PropTypes.string, title: PropTypes.string}).isRequired,
    markers: PropTypes.arrayOf(
      PropTypes.shape({
        path: PropTypes.array
      })
    ),

    history: PropTypes.shape({
      isLoadingEvents: PropTypes.bool.isRequired,
      isOpen: PropTypes.bool.isRequired,
      selectedEvent: PropTypes.object,
      document: PropTypes.shape({
        isLoading: PropTypes.bool.isRequired,
        snapshot: PropTypes.shape({_type: PropTypes.string})
      })
    }).isRequired,
    presence: PropTypes.any
  }

  static defaultProps = {
    markers: [],
    isConnected: true,
    initialValue: undefined
  }

  state = INITIAL_STATE

  componentDidMount() {
    if (filterFieldFn$) {
      this.filterFieldFnSubscription = filterFieldFn$.subscribe(filterField =>
        this.setState({filterField})
      )
    }
  }

  componentWillUnmount() {
    if (this.filterFieldFnSubscription) {
      this.filterFieldFnSubscription.unsubscribe()
    }
  }

  handleFocus = path => {
    this.setState({focusPath: path})
    setLocation([{type: 'document', documentId: this.getCanonicalDocumentId(), path}])
  }

  handleBlur = () => {
    // do nothing
  }

  isReadOnly() {
    const {document, schemaType, isConnected} = this.props
    const {draft, published} = document
    const isNonExistent = !draft && !published

    return (
      !isConnected ||
      !isActionEnabled(schemaType, 'update') ||
      (isNonExistent && !isActionEnabled(schemaType, 'create'))
    )
  }

  getCanonicalDocumentId() {
    const {displayed} = this.props.document
    return displayed && displayed._id && displayed._id.replace(/^drafts\./, '')
  }

  render() {
    const {
      document,
      headerHeight,
      id,
      history,
      schemaType,
      markers,
      patchChannel,
      initialValue,
      isNarrowScreen,
      presence
    } = this.props
    const {draft, published, displayed} = document
    const {focusPath, filterField} = this.state
    const value = draft || published
    const readOnly = this.isReadOnly()
    const documentId = this.getCanonicalDocumentId()

    const hasTypeMismatch = value && value._type && value._type !== schemaType.name
    if (hasTypeMismatch) {
      return (
        <div className={styles.typeMisMatchMessage}>
          This document is of type <code>{value._type}</code> and cannot be edited as{' '}
          <code>{schemaType.name}</code>
          <div>
            <Button onClick={this.handleEditAsActualType}>Edit as {value._type} instead</Button>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.root}>
        {history.isOpen ? (
          <HistoryForm document={displayed} schema={schema} schemaType={schemaType} />
        ) : (
          <EditForm
            headerHeight={headerHeight}
            id={id}
            isNarrowScreen={isNarrowScreen}
            value={draft || published || initialValue}
            filterField={filterField}
            focusPath={focusPath}
            markers={markers}
            onBlur={this.handleBlur}
            onChange={readOnly ? noop : this.props.onChange}
            onFocus={this.handleFocus}
            patchChannel={patchChannel}
            readOnly={readOnly}
            schema={schema}
            type={schemaType}
            presence={presence}
          />
        )}

        {afterEditorComponents.map((AfterEditorComponent, i) => (
          <AfterEditorComponent key={i} documentId={documentId} />
        ))}
      </div>
    )
  }
}
