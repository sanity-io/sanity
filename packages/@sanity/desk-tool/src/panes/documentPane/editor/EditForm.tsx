import React from 'react'
import {FormBuilder} from 'part:@sanity/form-builder'
import {Overlay as PresenceOverlay} from '@sanity/components/presence'
import documentStore from 'part:@sanity/base/datastore/document'

import styles from '../Editor.css'
import {tap} from 'rxjs/operators'
import {Subscription} from 'rxjs'

const preventDefault = ev => ev.preventDefault()
type Doc = any
type Schema = any
type SchemaType = any

interface Props {
  headerHeight: number
  id: string
  isNarrowScreen: boolean
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
      headerHeight,
      isNarrowScreen,
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
      <PresenceOverlay margins={[isNarrowScreen ? headerHeight : 0, 0, 0, 0]}>
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
      </PresenceOverlay>
    )
  }
}
