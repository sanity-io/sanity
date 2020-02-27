import React from 'react'
import {FormBuilder} from 'part:@sanity/form-builder'

import styles from '../styles/Editor.css'
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
  presence: any
}

export default class EditForm extends React.PureComponent<Props> {
  subscription?: Subscription
  patchChannel = FormBuilder.createPatchChannel()

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
      type,
      presence
    } = this.props
    return (
      <>
        <form className={styles.editor} onSubmit={preventDefault}>
          <FormBuilder
            schema={schema}
            patchChannel={this.patchChannel}
            value={value || {_type: type}}
            type={type}
            presence={presence}
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
