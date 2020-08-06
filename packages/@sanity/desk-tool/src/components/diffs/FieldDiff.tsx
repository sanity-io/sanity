import * as React from 'react'
import {resolveDiffComponent} from './resolveDiffComponent'
import {MissingDiffComponent} from './MissingDiffComponent'
import {DiffProps} from './types'

export function FieldDiff({schemaType, ...rest}: DiffProps): React.ReactElement {
  const Diff = resolveDiffComponent(schemaType) || MissingDiffComponent
  return <Diff schemaType={schemaType} {...rest} />
}
