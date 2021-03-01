import {useDocumentPresence} from '@sanity/base/hooks'
import {FormBuilder} from 'part:@sanity/form-builder'
import documentStore from 'part:@sanity/base/datastore/document'
import React, {FormEvent, useEffect, useMemo, useRef, memo} from 'react'
import {Subscription} from 'rxjs'
import {tap} from 'rxjs/operators'

const preventDefault = (ev: FormEvent) => ev.preventDefault()

type Doc = any
type Schema = any
type SchemaType = any

interface Props {
  id: string
  value: Doc
  compareValue: Doc | null

  filterField: () => boolean
  focusPath: any[]
  markers: any[]

  onBlur: () => void
  onChange: (event: any) => void
  onFocus: (focusPath: any[]) => void
  readOnly: boolean
  schema: Schema
  type: SchemaType
}

export const EditForm = memo((props: Props) => {
  const presence = useDocumentPresence(props.id)
  const subscriptionRef = useRef<Subscription | null>(null)
  const patchChannel = useMemo(() => FormBuilder.createPatchChannel(), [])
  const {
    filterField,
    focusPath,
    markers,
    value,
    onBlur,
    onFocus,
    onChange,
    compareValue,
    readOnly,
    schema,
    type,
  } = props

  useEffect(() => {
    subscriptionRef.current = documentStore.pair
      .documentEvents(props.id, props.type.name)
      .pipe(
        tap((event: any) => {
          patchChannel.receiveEvent(event)
        })
      )
      .subscribe()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [])

  return (
    <form onSubmit={preventDefault}>
      <FormBuilder
        schema={schema}
        patchChannel={patchChannel}
        value={value || {_type: type}}
        compareValue={compareValue}
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
})

EditForm.displayName = 'EditForm'
