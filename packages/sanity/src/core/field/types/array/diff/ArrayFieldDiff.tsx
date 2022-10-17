import {ArraySchemaType} from '@sanity/types'
import React, {useContext, useMemo} from 'react'
import {useDiffComponent} from '../../../../form/form-components-hooks'
import {ChangeResolver, DiffContext} from '../../../diff'
import {buildArrayChangeList} from '../../../diff/changes/buildChangeList'
import {ArrayDiff} from '../../../types'

interface ArrayFieldDiffProps {
  diff: ArrayDiff
  schemaType: ArraySchemaType
}

export function ArrayFieldDiff(props: ArrayFieldDiffProps) {
  const {diff, schemaType} = props
  const {path} = useContext(DiffContext)
  const DiffComponent = useDiffComponent()

  const changes = useMemo(
    () =>
      buildArrayChangeList(schemaType, diff, path, [], {
        fieldFilter: [],
        diffComponent: DiffComponent,
      }),
    [schemaType, diff, path, DiffComponent]
  )

  return (
    <>
      {changes.map((change) => (
        <ChangeResolver
          change={change}
          hidden={change.hidden}
          key={change.key}
          readOnly={change.readOnly}
        />
      ))}
    </>
  )
}
