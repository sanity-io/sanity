import {ObjectSchemaType} from '@sanity/types'
import {Box} from '@sanity/ui'
import React from 'react'
import {ChangeList} from '../../../diff'
import {DiffComponent, ObjectDiff} from '../../../types'

export interface ObjectFieldDiffProps {
  diff: ObjectDiff
  schemaType: ObjectSchemaType
}

export const ObjectFieldDiff: DiffComponent<ObjectDiff> = ({
  diff,
  schemaType,
}: ObjectFieldDiffProps) => {
  return (
    <Box data-testid="object-field-diff">
      <ChangeList diff={diff} schemaType={schemaType} />
    </Box>
  )
}
