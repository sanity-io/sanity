import {type ValidationMarker} from '@sanity/types'
import {type PropsWithChildren, useMemo} from 'react'

import {type InputProps} from '../../../form/types'
import {ScheduleBanner} from './ScheduleBanner'

export function ScheduledDocumentInput(props: PropsWithChildren<InputProps>) {
  const {value, validation, children} = props
  const doc: {_id?: string} = value as unknown as {_id: string}

  const markers: ValidationMarker[] = useMemo(
    () =>
      validation.map((v) => ({
        level: v.level,
        path: v.path,
        item: {message: v.message},
        message: v.message,
      })),
    [validation],
  )

  return (
    <>
      {doc?._id ? <ScheduleBanner id={doc._id} markers={markers} /> : null}
      {children}
    </>
  )
}
