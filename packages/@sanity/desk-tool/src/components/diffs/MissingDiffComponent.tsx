import * as React from 'react'
import {DiffComponent} from './types'

export const MissingDiffComponent: DiffComponent = ({schemaType}) => {
  return <div>No diff component registered for schema type "{schemaType.name}"</div>
}
