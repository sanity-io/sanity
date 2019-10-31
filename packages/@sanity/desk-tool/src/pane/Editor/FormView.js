import React from 'react'
import PropTypes from 'prop-types'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import Button from 'part:@sanity/components/buttons/default'
import schema from 'part:@sanity/base/schema'
import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
import filterFieldFn$ from 'part:@sanity/desk-tool/filter-fields-fn?'
import {PaneRouterContext} from '../../index'
import styles from '../styles/Editor.css'
import EditForm from './EditForm'
import HistoryForm from './HistoryForm'

const INITIAL_STATE = {
  focusPath: [],
  filterField: () => true
}

export default class FormView extends React.PureComponent {
  static contextType = PaneRouterContext

  static propTypes = {
    patchChannel: PropTypes.object,
    draft: PropTypes.shape({_id: PropTypes.string, _type: PropTypes.string}),
    published: PropTypes.shape({_id: PropTypes.string, _type: PropTypes.string}),
    initialValue: PropTypes.object,
    isReconnecting: PropTypes.bool,
    isLoading: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    type: PropTypes.shape({name: PropTypes.string, title: PropTypes.string}).isRequired,
    markers: PropTypes.arrayOf(
      PropTypes.shape({
        path: PropTypes.array
      })
    ),

    history: PropTypes.shape({
      isLoading: PropTypes.bool.isRequired,
      isOpen: PropTypes.bool.isRequired,
      selectedEvent: PropTypes.object,
      selectedIsLatest: PropTypes.bool.isRequired
    }).isRequired
  }

  static defaultProps = {
    markers: [],
    draft: undefined,
    published: undefined,
    isLoading: false,
    isReconnecting: false
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
    const selectedSchemaType = schema.get(this.props.type.name)
    return selectedSchemaType.liveEdit === true
  }

  handleSplitPane = () => {
    this.context.duplicateCurrentPane()
  }

  handleToggleViewButton = () => {
    this.context.setPaneView('someView')
  }

  render() {
    const {
      draft,
      published,
      history,
      type,
      markers,
      patchChannel,
      initialValue,
      isReconnecting
    } = this.props
    const {focusPath, filterField} = this.state
    const value = draft || published

    const hasTypeMismatch = value && value._type && value._type !== type.name
    if (hasTypeMismatch) {
      return (
        <div className={styles.typeMisMatchMessage}>
          This document is of type <code>{value._type}</code> and cannot be edited as{' '}
          <code>{type.name}</code>
          <div>
            <Button onClick={this.handleEditAsActualType}>Edit as {value._type} instead</Button>
          </div>
        </div>
      )
    }

    return (
      <>
        {history.isOpen && !history.isLoading && history.selectedEvent ? (
          <HistoryForm
            isLatest={history.selectedIsLatest}
            event={history.selectedEvent}
            schema={schema}
            type={type}
          />
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
            readOnly={isReconnecting || !isActionEnabled(type, 'update')}
            schema={schema}
            type={type}
          />
        )}

        {afterEditorComponents.map((AfterEditorComponent, i) => (
          <AfterEditorComponent key={i} documentId={published._id} />
        ))}
      </>
    )
  }
}
