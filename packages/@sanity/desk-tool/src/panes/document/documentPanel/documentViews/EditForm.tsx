// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {useDocumentPresence} from '@sanity/base/hooks'
import {Marker, Path, SanityDocument} from '@sanity/types'
import {Box} from '@sanity/ui'
import {FormBuilder} from 'part:@sanity/form-builder'
import documentStore from 'part:@sanity/base/datastore/document'
import React, {useEffect, useMemo, useRef} from 'react'
import {Subscription} from 'rxjs'
import {tap} from 'rxjs/operators'

const preventDefault = (ev: React.FormEvent) => ev.preventDefault()

interface EditFormProps {
  compareValue: Partial<SanityDocument> | null
  filterField: () => boolean
  focusPath: Path
  id: string
  markers: Marker[]
  onBlur: () => void
  onChange: (patches: any[]) => void
  onFocus: (focusPath: Path) => void
  readOnly: boolean
  schema: any
  type: any
  value: Partial<SanityDocument> | null
}

export function EditForm(props: EditFormProps) {
  const {
    compareValue,
    filterField,
    focusPath,
    id,
    markers,
    onBlur,
    onChange,
    onFocus,
    readOnly,
    schema,
    type,
    value,
  } = props
  const presence = useDocumentPresence(id)
  const subscriptionRef = useRef<Subscription | null>(null)
  const patchChannel = useMemo(() => FormBuilder.createPatchChannel(), [])

  useEffect(() => {
    subscriptionRef.current = documentStore.pair
      .documentEvents(id, type.name)
      .pipe(
        tap((event) => {
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
  }, [id, patchChannel, type.name])

  return useMemo(
    () => (
      <Box as="form" onSubmit={preventDefault}>
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
      </Box>
    ),
    [
      compareValue,
      filterField,
      focusPath,
      markers,
      onBlur,
      onChange,
      onFocus,
      patchChannel,
      presence,
      readOnly,
      schema,
      type,
      value,
    ]
  )
}
