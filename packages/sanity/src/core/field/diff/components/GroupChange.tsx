import React from 'react'
import {Stack} from '@sanity/ui'
import {isFieldChange} from '../helpers'
import {isPTSchemaType} from '../../types/portableText/diff'
import {GroupChangeNode} from '../../types'
import {ChangeResolver} from './ChangeResolver'
import {ChangeListWrapper, GroupChangeContainer} from './GroupChange.styled'

/** @internal */
export function GroupChange(
  props: {
    change: GroupChangeNode
    readOnly?: boolean
    hidden?: boolean
  } & React.HTMLAttributes<HTMLDivElement>
): React.ReactElement | null {
  const {
    change: {changes},
    readOnly,
    hidden,
  } = props

  const isPortableText = changes.every(
    (change) => isFieldChange(change) && isPTSchemaType(change.schemaType)
  )

  if (hidden) return null

  return (
    <Stack space={1} as={GroupChangeContainer} data-portable-text={isPortableText ? '' : undefined}>
      <Stack as={ChangeListWrapper} space={5}>
        {changes.map((change) => (
          <ChangeResolver key={change.key} change={change} readOnly={readOnly} hidden={hidden} />
        ))}
      </Stack>
    </Stack>
  )
}
