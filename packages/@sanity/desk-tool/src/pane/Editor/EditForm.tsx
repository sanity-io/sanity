import React from 'react'
import {FormBuilder} from 'part:@sanity/form-builder'
import documentStore from 'part:@sanity/base/datastore/document'

import styles from '../styles/Editor.css'
import {tap} from 'rxjs/operators'
import {Subscription} from 'rxjs'

const preventDefault = ev => ev.preventDefault()
type Doc = any
type Schema = any
type SchemaType = any

interface Props {
  id: string
  value: Doc

  filterField: () => boolean
  focusPath: []
  markers: []

  onBlur: () => void
  onChange: (event: any) => void
  onFocus: (focusPath: any[]) => void
  readOnly: boolean
  schema: Schema
  type: SchemaType
}

export default class EditForm extends React.PureComponent<Props> {
  subscription?: Subscription
  patchChannel = FormBuilder.createPatchChannel()

  componentDidMount() {
    this.subscription = documentStore.local
      .documentEventsFor(this.props.id, this.props.type.name)
      .pipe(
        tap((event: any) => {
          this.patchChannel.receiveEvent(event)
        })
      )
      .subscribe()
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.unsubscribe()
  }

  render() {
    const {
      filterField,
      focusPath,
      markers,
      value,
      onBlur,
      onFocus,
      onChange,
      readOnly,
      schema,
      type
    } = this.props
    return (
      <>
        <form
          className={styles.editor}
          onSubmit={preventDefault}
          id="Sanity_Default_DeskTool_Editor_ScrollContainer"
        >
          <FormBuilder
            schema={schema}
            patchChannel={this.patchChannel}
            value={value || {_type: type}}
            type={type}
            filterField={filterField}
            readOnly={readOnly}
            onBlur={onBlur}
            onFocus={onFocus}
            focusPath={focusPath}
            onChange={onChange}
            markers={markers}
          />
        </form>
      </>
    )
  }
}
