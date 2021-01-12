import React from 'react'
import PreviewSubscriber from './PreviewSubscriber'
import {Type} from '../types'

function arrify<T>(val: T | T[]) {
  if (Array.isArray(val)) {
    return val
  }
  return typeof val === undefined ? [] : [val]
}

type Props = {
  document: Document
  fields: string | string[]
  type: Type
  children: (snapshot: Document) => React.ReactChildren
}
export default function PreviewFields(props: Props) {
  return (
    <PreviewSubscriber value={props.document} type={props.type} fields={arrify(props.fields)}>
      {({snapshot}) => <span>{snapshot ? props.children(snapshot) : null}</span>}
    </PreviewSubscriber>
  )
}
