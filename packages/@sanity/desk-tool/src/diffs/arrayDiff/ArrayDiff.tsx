import React from 'react'
import {DefaultArrayDiff} from './defaultArrayDiff'
import {isPTSchemaType} from './helpers'
import {PTDiff} from './ptDiff'
import {ArrayDiffProps} from './types'

export function ArrayDiff(props: ArrayDiffProps) {
  if (isPTSchemaType(props.schemaType)) {
    return <PTDiff diff={props.diff} items={props.items} schemaType={props.schemaType} />
  }

  return <DefaultArrayDiff diff={props.diff} items={props.items} schemaType={props.schemaType} />
}
