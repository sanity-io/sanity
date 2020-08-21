/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, {FormEvent} from 'react'
import {FormBuilder} from 'part:@sanity/form-builder'
import documentStore from 'part:@sanity/base/datastore/document'
import {tap} from 'rxjs/operators'
import {Subscription} from 'rxjs'

const preventDefault = (ev: FormEvent) => ev.preventDefault()

type Doc = any
type Schema = any
type SchemaType = any

interface Props {
  id: string
  value: Doc

  filterField: () => boolean
  focusPath: any[]
  markers: any[]

  onBlur: () => void
  onChange: (event: any) => void
  onFocus: (focusPath: any[]) => void
  readOnly: boolean
  schema: Schema
  type: SchemaType
  presence: any
}

export class EditForm extends React.PureComponent<Props> {
  subscription?: Subscription
  patchChannel = FormBuilder.createPatchChannel()

  componentDidMount() {
    this.subscription = documentStore.pair
      .documentEvents(this.props.id, this.props.type.name)
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
      type,
      presence
    } = this.props

    return (
      <form onSubmit={preventDefault}>
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
    )
  }
}
