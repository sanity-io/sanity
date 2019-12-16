import React from 'react'
import PropTypes from 'prop-types'
import {FormBuilder, patchEvents} from 'part:@sanity/form-builder'
import styles from '../styles/Editor.css'
import {map, tap} from 'rxjs/operators'
import {Subscription} from '@sanity/form-builder/lib/src/typedefs/observable'

const preventDefault = ev => ev.preventDefault()
type Doc = any
type Schema = any
type SchemaType = any

interface Props {
  id: string
  draft: Doc
  published: Doc
  initialValue: Doc

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
    this.subscription = patchEvents(this.props.id)
      .pipe(
        tap(pair => {
          console.log(pair)
        })
      )
      .subscribe()
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.unsubscribe()
  }

  receivePatches(event) {
    this.patchChannel.receivePatches({
      patches: event.patches,
      snapshot: event.document
    })
  }

  render() {
    const {
      draft,
      published,
      filterField,
      focusPath,
      initialValue,
      markers,
      onBlur,
      onChange,
      onFocus,
      readOnly,
      schema,
      type
    } = this.props
    const value = draft || published || initialValue
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
