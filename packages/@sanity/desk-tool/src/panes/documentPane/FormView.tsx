/* eslint-disable @typescript-eslint/explicit-function-return-type */

import React from 'react'
import {Subscription} from 'rxjs'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import Button from 'part:@sanity/components/buttons/default'
import schema from 'part:@sanity/base/schema'
import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
import filterFieldFn$ from 'part:@sanity/desk-tool/filter-fields-fn?'
import {setLocation} from 'part:@sanity/base/datastore/presence'
import {Overlay as PresenceOverlay} from '@sanity/components/presence'
import EditForm from './EditForm'
import {Doc} from './types'

import styles from './FormView.css'

interface Props {
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Doc | null
  initialValue: Doc
  isConnected: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (patches: any[]) => void
  schemaType: {name: string; title: string}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  markers: Array<{path: any[]}>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  presence: any
  initialFocusPath: unknown[] | null
}

const noop = () => undefined

const INITIAL_STATE = {
  focusPath: [] as unknown[],
  filterField: () => true
}

export default class FormView extends React.PureComponent<Props> {
  static defaultProps = {
    markers: [],
    isConnected: true
  }

  state = INITIAL_STATE

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterFieldFnSubscription: Subscription | null = null

  componentDidMount() {
    const {initialFocusPath} = this.props
    if (initialFocusPath) {
      this.setState({
        focusPath: initialFocusPath
      })
      this.reportFocusPath(initialFocusPath)
    }

    if (filterFieldFn$) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.filterFieldFnSubscription = filterFieldFn$.subscribe((filterField: any) =>
        this.setState({filterField})
      )
    }
  }

  componentWillUnmount() {
    if (this.filterFieldFnSubscription) {
      this.filterFieldFnSubscription.unsubscribe()
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleFocus = (path: any[]) => {
    this.setState({focusPath: path})
  }

  reportFocusPath(path) {
    setLocation([
      {
        type: 'document',
        documentId: this.props.id,
        path,
        lastActiveAt: new Date().toISOString()
      }
    ])
  }

  handleBlur = () => {
    // do nothing
  }

  handleEditAsActualType = () => {
    // TODO
  }

  isReadOnly() {
    const {value, schemaType, isConnected} = this.props
    const isNonExistent = !value || !value._id

    return (
      !isConnected ||
      !isActionEnabled(schemaType, 'update') ||
      (isNonExistent && !isActionEnabled(schemaType, 'create'))
    )
  }

  render() {
    const {id, value, initialValue, markers, presence, schemaType} = this.props
    const {focusPath, filterField} = this.state
    const readOnly = this.isReadOnly()
    const documentId = value && value._id && value._id.replace(/^drafts\./, '')

    const hasTypeMismatch = value && value._type && value._type !== schemaType.name
    if (hasTypeMismatch) {
      return (
        <div className={styles.typeMisMatchMessage}>
          This document is of type <code>{value!._type}</code> and cannot be edited as{' '}
          <code>{schemaType.name}</code>
          <div>
            <Button onClick={this.handleEditAsActualType}>Edit as {value!._type} instead</Button>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.root}>
        <PresenceOverlay>
          <EditForm
            id={id}
            value={value || initialValue}
            filterField={filterField}
            focusPath={focusPath}
            markers={markers}
            onBlur={this.handleBlur}
            onChange={readOnly ? noop : this.props.onChange}
            onFocus={this.handleFocus}
            readOnly={readOnly}
            schema={schema}
            type={schemaType}
            presence={presence}
          />
        </PresenceOverlay>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {afterEditorComponents.map((AfterEditorComponent: any, idx: number) => (
          <AfterEditorComponent key={String(idx)} documentId={documentId} />
        ))}
      </div>
    )
  }
}
