import {Path, SchemaType, ValidationMarker} from '@sanity/types'
import React, {useMemo} from 'react'
import {FormFieldPresence} from '../../../presence'
import {PatchArg} from '../../patch'
import {ArrayMember, ObjectMember} from '../../types'
import {EMPTY_ARRAY} from '../../utils/empty'
import {FormNodeContext, FormNodeContextValue} from './FormNodeContext'

/**
 * @internal
 */
export function FormNodeProvider(props: {
  children?: React.ReactNode
  collapsed?: boolean
  collapsible?: boolean
  compareValue?: unknown
  inputId: string
  level?: number
  members?: Array<ArrayMember | ObjectMember>
  onChange?: (...patches: PatchArg[]) => void
  path: Path
  presence?: FormFieldPresence[]
  type: SchemaType
  validation?: ValidationMarker[]
}) {
  const {
    children,
    collapsed = false,
    collapsible = false,
    compareValue,
    inputId,
    level = 0,
    members,
    onChange,
    path,
    presence = EMPTY_ARRAY,
    type,
    validation = EMPTY_ARRAY,
  } = props

  const formNode: FormNodeContextValue<unknown> = useMemo(
    () => ({
      collapsed,
      collapsible,
      compareValue,
      inputId,
      level,
      members,
      onChange,
      path,
      presence,
      type,
      validation,
    }),
    [
      collapsed,
      collapsible,
      compareValue,
      inputId,
      level,
      members,
      onChange,
      path,
      presence,
      type,
      validation,
    ]
  )

  return <FormNodeContext.Provider value={formNode}>{children}</FormNodeContext.Provider>
}
