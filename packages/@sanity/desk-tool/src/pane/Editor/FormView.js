import React from 'react'
import PropTypes from 'prop-types'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import Button from 'part:@sanity/components/buttons/default'
import schema from 'part:@sanity/base/schema'
import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
import filterFieldFn$ from 'part:@sanity/desk-tool/filter-fields-fn?'
import styles from '../styles/Editor.css'
import EditForm from './EditForm'
import HistoryForm from './HistoryForm'

const INITIAL_STATE = {
  focusPath: [],
  filterField: () => true
}

export default class FormView extends React.PureComponent {
  static propTypes = {
    patchChannel: PropTypes.object,
    document: PropTypes.shape({
      draft: PropTypes.shape({_id: PropTypes.string, _type: PropTypes.string}),
      published: PropTypes.shape({_id: PropTypes.string, _type: PropTypes.string}),
      displayed: PropTypes.shape({_type: PropTypes.string})
    }).isRequired,
    initialValue: PropTypes.shape({_type: PropTypes.string}),
    isReconnecting: PropTypes.bool,
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
    }).isRequired
  }

  static defaultProps = {
    markers: [],
    isReconnecting: false,
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
  }

  handleBlur = () => {
    // do nothing
  }

  isLiveEditEnabled() {
    const selectedSchemaType = schema.get(this.props.schemaType.name)
    return selectedSchemaType.liveEdit === true
  }

  isReadOnly() {
    const {document, schemaType, isReconnecting} = this.props
    const {draft, published} = document
    const isNonExistent = !draft && !published

    return (
      isReconnecting ||
      !isActionEnabled(schemaType, 'update') ||
      (isNonExistent && !isActionEnabled(schemaType, 'create'))
    )
  }

  render() {
    const {document, history, schemaType, markers, patchChannel, initialValue} = this.props
    const {draft, published, displayed} = document
    const {focusPath, filterField} = this.state
    const value = draft || published

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
            draft={draft}
            filterField={filterField}
            focusPath={focusPath}
            initialValue={initialValue}
            markers={markers}
            onBlur={this.handleBlur}
            onChange={this.props.onChange}
            onFocus={this.handleFocus}
            patchChannel={patchChannel}
            published={published}
            readOnly={this.isReadOnly()}
            schema={schema}
            type={schemaType}
          />
        )}

        {afterEditorComponents.map((AfterEditorComponent, i) => (
          <AfterEditorComponent key={i} documentId={published._id} />
        ))}
      </div>
    )
  }
}
